import { injectable, inject } from 'tsyringe';
import { IProcessReservationRefundUseCase } from '../../../interface/admin/reservation/process_reservation_refund_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IPaymentRepository } from '../../../../../domain/repositories/payment_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
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
import { EmailType, RefundConfirmationEmailData } from '../../../../../shared/types/email.types';
import { FRONTEND_CONFIG } from '../../../../../shared/config';

/**
 * Use case for processing reservation refund
 * Admin can process refunds via Stripe and notify user
 */
@injectable()
export class ProcessReservationRefundUseCase implements IProcessReservationRefundUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IPaymentRepository as never)
    private readonly paymentRepository: IPaymentRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.INotificationService)
    private readonly notificationService: INotificationService,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService
  ) {}

  async execute(
    reservationId: string,
    amount: number,
    adminUserId: string,
    reason?: string
  ): Promise<{ reservation: Reservation; refundId: string }> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (!amount || amount <= 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REFUND_AMOUNT', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Check if reservation can be refunded
    if (reservation.isRefunded()) {
      throw new AppError(
        'Reservation has already been refunded',
        'RESERVATION_ALREADY_REFUNDED',
        400
      );
    }

    // Fetch payment
    const payment = await this.paymentRepository.findById(reservation.paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 'PAYMENT_NOT_FOUND', 404);
    }

    // Check if payment can be refunded
    if (!payment.canBeRefunded()) {
      throw new AppError(
        'Payment cannot be refunded',
        'PAYMENT_NOT_REFUNDABLE',
        400
      );
    }

    // Validate refund amount
    const maxRefundAmount = payment.amount - (reservation.refundedAmount || 0);
    if (amount > maxRefundAmount) {
      throw new AppError(
        `Refund amount cannot exceed ${maxRefundAmount}`,
        'REFUND_AMOUNT_EXCEEDED',
        400
      );
    }

    // Process refund via Stripe
    let refundId: string;
    try {
      if (!payment.paymentIntentId) {
        throw new AppError(
          'Payment intent ID not found',
          'PAYMENT_INTENT_NOT_FOUND',
          400
        );
      }

      const stripe = getStripeInstance();
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: reason ? 'requested_by_customer' : undefined,
        metadata: {
          reservationId,
          reason: reason || '',
          refundedBy: adminUserId,
        },
      });

      refundId = refund.id;
      logger.info(`Stripe refund successful: ID=${refundId}, Amount=${amount}, Reservation=${reservationId}`);
    } catch (stripeError) {
      logger.error(
        `Stripe refund failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`
      );
      throw new AppError(
        `Failed to process refund: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`,
        'STRIPE_REFUND_FAILED',
        500
      );
    }

    // Update payment status if fully refunded
    const newRefundedAmount = (reservation.refundedAmount || 0) + amount;
    const isFullyRefunded = newRefundedAmount >= payment.amount;

    if (isFullyRefunded) {
      await this.paymentRepository.updateById(payment.paymentId, {
        status: PaymentStatus.REFUNDED,
      } as Partial<import('../../../../../infrastructure/database/mongodb/models/payment.model').IPaymentModel>);
    }

    // Update reservation
    const now = new Date();
    const update: Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel> = {
      refundedAmount: newRefundedAmount,
      refundedAt: now,
      refundStatus: isFullyRefunded ? 'full' : 'partial',
      status: isFullyRefunded ? ReservationStatus.REFUNDED : reservation.status,
    };
    await this.reservationRepository.updateById(reservationId, update);

    // Create modification record
    const modificationId = randomUUID();
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'other',
      `Refund processed: ${amount} ${payment.currency}${reason ? `. Reason: ${reason}` : ''}`,
      (reservation.refundedAmount || 0).toString(),
      newRefundedAmount.toString(),
      {
        refundId,
        refundAmount: amount,
        reason,
        isFullyRefunded,
      }
    );
    await this.modificationRepository.create(modification);

    // Send notification to user
    try {
      await this.notificationService.sendNotification({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_REFUNDED,
        title: 'Refund Processed',
        message: `A refund of ${amount} ${payment.currency} has been processed for your reservation${reason ? `. Reason: ${reason}` : ''}. Refund ID: ${refundId}`,
        data: {
          reservationId,
          refundAmount: amount,
          refundId,
          reason,
        },
      });
    } catch (notificationError) {
      logger.error(
        `Failed to send notification for refund: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
      );
    }

    // Send refund confirmation email
    try {
      const user = await this.userRepository.findById(reservation.userId);
      if (user && user.email) {
        const tripTypeLabel = reservation.tripType === TripType.ONE_WAY ? 'one_way' : 'two_way';
        const viewReservationLink = `${FRONTEND_CONFIG.URL}/reservations/${reservationId}`;

        const emailData: RefundConfirmationEmailData = {
          email: user.email,
          fullName: user.fullName,
          reservationNumber: reservation.reservationNumber,
          refundAmount: amount,
          refundId,
          refundDate: now,
          currency: payment.currency,
          tripName: reservation.tripName,
          tripType: tripTypeLabel,
          reason,
          isFullRefund: isFullyRefunded,
          viewReservationLink,
        };

        await this.emailService.sendEmail(EmailType.REFUND_CONFIRMATION, emailData);
        logger.info(`Refund confirmation email sent to ${user.email} for reservation ${reservationId}, refund ID: ${refundId}`);
      }
    } catch (emailError) {
      logger.error(
        `Failed to send refund confirmation email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
      );
      // Don't throw error - email failure shouldn't fail the refund
    }

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    logger.info(
      `Admin processed refund for reservation: ${reservationId}, amount: ${amount} ${payment.currency}`
    );

    return {
      reservation: updatedReservation,
      refundId,
    };
  }
}

