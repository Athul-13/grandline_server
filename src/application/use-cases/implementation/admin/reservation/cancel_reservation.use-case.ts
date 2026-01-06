import { injectable, inject } from 'tsyringe';
import { ICancelReservationUseCase } from '../../../interface/admin/reservation/cancel_reservation_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { IPaymentRepository } from '../../../../../domain/repositories/payment_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { INotificationService } from '../../../../../domain/services/notification_service.interface';
import { IEmailService } from '../../../../../domain/services/email_service.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../di/tokens';
import { Reservation } from '../../../../../domain/entities/reservation.entity';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { ReservationStatus, NotificationType, ERROR_MESSAGES, TripType } from '../../../../../shared/constants';
import { PaymentStatus } from '../../../../../domain/entities/payment.entity';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { randomUUID } from 'crypto';
import { getStripeInstance } from '../../../../../infrastructure/service/stripe.service';
import { EmailType, CancellationWithRefundEmailData } from '../../../../../shared/types/email.types';
import { FRONTEND_CONFIG } from '../../../../../shared/config';

/**
 * Use case for cancelling reservation
 * Admin can cancel reservation and notify user
 */
@injectable()
export class CancelReservationUseCase implements ICancelReservationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(REPOSITORY_TOKENS.IPaymentRepository as never)
    private readonly paymentRepository: IPaymentRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.INotificationService)
    private readonly notificationService: INotificationService,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService
  ) {}

  async execute(
    reservationId: string,
    reason: string,
    adminUserId: string
  ): Promise<Reservation> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'CANCELLATION_REASON_REQUIRED', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Check if reservation can be cancelled
    if (reservation.isCancelled()) {
      throw new AppError(
        'Reservation is already cancelled',
        'RESERVATION_ALREADY_CANCELLED',
        400
      );
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new AppError(
        'Cannot cancel a completed reservation',
        'RESERVATION_COMPLETED',
        400
      );
    }

    const now = new Date();
    let refundId: string | undefined;
    let refundAmount: number | undefined;
    let currency: string | undefined;
    let isFullyRefunded = false;

    // Check if payment exists and process refund if applicable
    try {
      const payment = await this.paymentRepository.findById(reservation.paymentId);
      if (payment && payment.canBeRefunded()) {
        // Calculate refundable amount
        const maxRefundAmount = payment.amount - (reservation.refundedAmount || 0);
        
        if (maxRefundAmount > 0) {
          // Process refund via Stripe
          try {
            if (!payment.paymentIntentId) {
              logger.warn(`Payment intent ID not found for reservation ${reservationId}, skipping refund`);
            } else {
              const stripe = getStripeInstance();
              const refund = await stripe.refunds.create({
                payment_intent: payment.paymentIntentId,
                amount: Math.round(maxRefundAmount * 100), // Convert to cents
                reason: 'requested_by_customer',
                metadata: {
                  reservationId,
                  reason,
                  refundedBy: adminUserId,
                },
              });

              refundId = refund.id;
              refundAmount = maxRefundAmount;
              currency = payment.currency;
              const newRefundedAmount = (reservation.refundedAmount || 0) + maxRefundAmount;
              isFullyRefunded = newRefundedAmount >= payment.amount;

              logger.info(`Stripe refund successful: ID=${refundId}, Amount=${refundAmount}, Reservation=${reservationId}`);

              // Update payment status if fully refunded
              if (isFullyRefunded) {
                await this.paymentRepository.updateById(payment.paymentId, {
                  status: PaymentStatus.REFUNDED,
                } as Partial<import('../../../../../infrastructure/database/mongodb/models/payment.model').IPaymentModel>);
              }

              // Update reservation refund fields
              await this.reservationRepository.updateById(reservationId, {
                refundedAmount: newRefundedAmount,
                refundedAt: now,
                refundStatus: isFullyRefunded ? 'full' : 'partial',
              } as Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel>);
            }
          } catch (stripeError) {
            logger.error(
              `Stripe refund failed for reservation ${reservationId}: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`
            );
            // Continue with cancellation even if refund fails
          }
        }
      }
    } catch (paymentError) {
      logger.warn(
        `Error checking payment for refund: ${paymentError instanceof Error ? paymentError.message : 'Unknown error'}`
      );
      // Continue with cancellation even if payment check fails
    }

    // Update reservation - cancel and free up driver/vehicles
    const finalStatus = isFullyRefunded ? ReservationStatus.REFUNDED : ReservationStatus.CANCELLED;
    await this.reservationRepository.updateById(reservationId, {
      status: finalStatus,
      cancelledAt: now,
      cancellationReason: reason,
      assignedDriverId: undefined, // Free up driver
    } as Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel>);

    // Create modification record
    const modificationId = randomUUID();
    const modificationMessage = refundId
      ? `Reservation cancelled and refunded: ${reason}. Refund: ${refundAmount} ${currency}`
      : `Reservation cancelled: ${reason}`;
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'status_change',
      modificationMessage,
      reservation.status,
      finalStatus,
      {
        reason,
        refundId,
        refundAmount,
        isFullyRefunded,
      }
    );
    await this.modificationRepository.create(modification);

    // Send email if refund was processed
    if (refundId && refundAmount && currency) {
      try {
        const user = await this.userRepository.findById(reservation.userId);
        if (user && user.email) {
          const tripTypeLabel = reservation.tripType === TripType.ONE_WAY ? 'one_way' : 'two_way';
          const viewReservationLink = `${FRONTEND_CONFIG.URL}/reservations/${reservationId}`;

          const emailData: CancellationWithRefundEmailData = {
            email: user.email,
            fullName: user.fullName,
            reservationNumber: reservation.reservationNumber,
            cancellationReason: reason,
            refundAmount,
            refundId,
            refundDate: now,
            cancelledAt: now,
            currency,
            tripName: reservation.tripName,
            tripType: tripTypeLabel,
            viewReservationLink,
            isFullRefund: isFullyRefunded,
          };

          await this.emailService.sendEmail(EmailType.CANCELLATION_WITH_REFUND, emailData);
          logger.info(`Cancellation email with refund sent to ${user.email} for reservation ${reservationId}`);
        }
      } catch (emailError) {
        logger.error(
          `Failed to send cancellation email with refund: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
        );
        // Don't throw error - email failure shouldn't fail the cancellation
      }
    }

    // Send notification to user
    try {
      const notificationMessage = refundId
        ? `Your reservation has been cancelled and ${refundAmount} ${currency} has been refunded. Refund ID: ${refundId}`
        : `Your reservation has been cancelled. Reason: ${reason}`;

      await this.notificationService.sendNotification({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_CANCELLED,
        title: 'Reservation Cancelled',
        message: notificationMessage,
        data: {
          reservationId,
          reason,
          refundId,
          refundAmount,
          isFullRefund: isFullyRefunded,
        },
      });
    } catch (notificationError) {
      logger.error(
        `Failed to send notification for cancellation: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
      );
    }

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    logger.info(`Admin cancelled reservation: ${reservationId}, reason: ${reason}`);

    return updatedReservation;
  }
}

