import { injectable, inject } from 'tsyringe';
import { IChangeReservationDriverUseCase } from '../../../interface/admin/reservation/change_reservation_driver_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IDriverRepository } from '../../../../../domain/repositories/driver_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { IReservationItineraryRepository } from '../../../../../domain/repositories/reservation_itinerary_repository.interface';
import { ICreateNotificationUseCase } from '../../../interface/notification/create_notification_use_case.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../../di/tokens';
import { Reservation } from '../../../../../domain/entities/reservation.entity';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { NotificationType, ERROR_MESSAGES, ReservationStatus } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { canAssignDriverToReservation } from '../../../../../shared/utils/driver_assignment.util';
import { randomUUID } from 'crypto';

/**
 * Use case for changing reservation driver
 * Admin can change driver and notify user
 */
@injectable()
export class ChangeReservationDriverUseCase implements IChangeReservationDriverUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository,
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase
  ) {}

  async execute(
    reservationId: string,
    driverId: string,
    adminUserId: string,
    reason?: string
  ): Promise<Reservation> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_DRIVER_ID', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Check if reservation can be modified
    if (!reservation.canBeModified()) {
      throw new AppError(
        'Reservation cannot be modified',
        'RESERVATION_NOT_MODIFIABLE',
        400
      );
    }

    // Check if driver is the same
    if (reservation.assignedDriverId === driverId) {
      throw new AppError(
        'Driver is already assigned to this reservation',
        'DRIVER_ALREADY_ASSIGNED',
        400
      );
    }

    // Verify driver exists
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new AppError('Driver not found', 'DRIVER_NOT_FOUND', 404);
    }

    // Get itinerary for eligibility check and date range validation
    const itinerary = await this.itineraryRepository.findByReservationId(reservationId);
    if (itinerary.length === 0) {
      throw new AppError('Reservation itinerary not found', 'ITINERARY_NOT_FOUND', 404);
    }

    // Check driver assignment eligibility using the guard
    const now = new Date();
    const eligibility = canAssignDriverToReservation(driver, itinerary, now);
    if (!eligibility.canAssign) {
      throw new AppError(
        eligibility.reason || 'Driver cannot be assigned',
        'DRIVER_NOT_AVAILABLE',
        400
      );
    }

    // Check for conflicts with other reservations (planning check)
    const arrivalTimes = itinerary.map((stop) => stop.arrivalTime);
    const minDate = new Date(Math.min(...arrivalTimes.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...arrivalTimes.map((d) => d.getTime())));

    const bookedDriverIds = await this.reservationRepository.findBookedDriverIdsInDateRange(
      minDate,
      maxDate,
      reservationId
    );

    if (bookedDriverIds.has(driverId)) {
      throw new AppError(
        'Driver is already booked during this reservation period',
        'DRIVER_BOOKED',
        400
      );
    }

    // Store previous driver
    const previousDriverId = reservation.assignedDriverId;

    // Update reservation (reuse 'now' from eligibility check above)
    await this.reservationRepository.updateById(reservationId, {
      assignedDriverId: driverId,
      driverChangedAt: now,
      status: reservation.status === ReservationStatus.CONFIRMED ? ReservationStatus.MODIFIED : reservation.status,
    } as Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel>);

    // Create modification record
    const modificationId = randomUUID();
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'driver_change',
      `Driver changed${reason ? `: ${reason}` : ''}`,
      previousDriverId || 'None',
      driverId,
      {
        reason,
        previousDriverId,
        newDriverId: driverId,
        driverName: driver.fullName,
      }
    );
    await this.modificationRepository.create(modification);

    // Send notification to user
    try {
      await this.createNotificationUseCase.execute({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_DRIVER_CHANGED,
        title: 'Driver Changed for Your Reservation',
        message: `The driver for your reservation has been changed${reason ? `. Reason: ${reason}` : ''}`,
        data: {
          reservationId,
          previousDriverId,
          newDriverId: driverId,
          driverName: driver.fullName,
          reason,
        },
      });
    } catch (notificationError) {
      logger.error(
        `Failed to send notification for driver change: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
      );
    }

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    logger.info(
      `Admin changed driver for reservation: ${reservationId}, ${previousDriverId} -> ${driverId}`
    );

    return updatedReservation;
  }
}

