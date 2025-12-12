import { injectable, inject } from 'tsyringe';
import { ICancelReservationUseCase } from '../../../interface/admin/reservation/cancel_reservation_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { ICreateNotificationUseCase } from '../../../interface/notification/create_notification_use_case.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../../di/tokens';
import { Reservation } from '../../../../../domain/entities/reservation.entity';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { ReservationStatus, NotificationType, ERROR_MESSAGES } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { randomUUID } from 'crypto';

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
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase
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

    // Update reservation - cancel and free up driver/vehicles
    const now = new Date();
    await this.reservationRepository.updateById(reservationId, {
      status: ReservationStatus.CANCELLED,
      cancelledAt: now,
      cancellationReason: reason,
      assignedDriverId: undefined, // Free up driver
    } as Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel>);

    // Create modification record
    const modificationId = randomUUID();
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'status_change',
      `Reservation cancelled: ${reason}`,
      reservation.status,
      ReservationStatus.CANCELLED,
      {
        reason,
      }
    );
    await this.modificationRepository.create(modification);

    // Send notification to user
    try {
      await this.createNotificationUseCase.execute({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_CANCELLED,
        title: 'Reservation Cancelled',
        message: `Your reservation has been cancelled. Reason: ${reason}`,
        data: {
          reservationId,
          reason,
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

