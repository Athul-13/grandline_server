import { injectable, inject } from 'tsyringe';
import { IUpdateReservationStatusUseCase } from '../../../interface/admin/reservation/update_reservation_status_use_case.interface';
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
 * Use case for updating reservation status
 * Admin can change reservation status and notify user
 */
@injectable()
export class UpdateReservationStatusUseCase implements IUpdateReservationStatusUseCase {
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
    status: ReservationStatus,
    adminUserId: string,
    reason?: string
  ): Promise<Reservation> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Validate status transition
    const currentStatus = reservation.status;

    // Don't allow changing to same status
    if (currentStatus === status) {
      throw new AppError(
        `Reservation is already ${status}`,
        'RESERVATION_STATUS_UNCHANGED',
        400
      );
    }

    // Validate transitions (can't go back from cancelled/completed/refunded)
    if (
      (currentStatus === ReservationStatus.CANCELLED ||
        currentStatus === ReservationStatus.COMPLETED ||
        currentStatus === ReservationStatus.REFUNDED) &&
      status !== currentStatus
    ) {
      throw new AppError(
        `Cannot change status from ${currentStatus}`,
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    // Update reservation status
    // Use the model interface type for updates (allows updating readonly entity fields)
    const update: Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel> = {
      status,
    };

    // Set cancelledAt and cancellationReason if cancelling
    if (status === ReservationStatus.CANCELLED) {
      update.cancelledAt = new Date();
      update.cancellationReason = reason;
    }

    await this.reservationRepository.updateById(reservationId, update);

    // Create modification record
    const modificationId = randomUUID();
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'status_change',
      `Reservation status changed from ${currentStatus} to ${status}${reason ? `: ${reason}` : ''}`,
      currentStatus,
      status,
      { reason }
    );
    await this.modificationRepository.create(modification);

    // Send notification to user
    try {
      await this.createNotificationUseCase.execute({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_STATUS_CHANGED,
        title: 'Reservation Status Updated',
        message: `Your reservation status has been changed to ${status}${reason ? `. Reason: ${reason}` : ''}`,
        data: {
          reservationId,
          previousStatus: currentStatus,
          newStatus: status,
          reason,
        },
      });
    } catch (notificationError) {
      logger.error(
        `Failed to send notification for reservation status change: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
      );
      // Don't fail the operation if notification fails
    }

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    logger.info(
      `Admin updated reservation status: ${reservationId}, ${currentStatus} -> ${status}`
    );

    return updatedReservation;
  }
}

