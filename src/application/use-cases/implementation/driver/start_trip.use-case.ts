import { inject, injectable } from 'tsyringe';
import { IStartTripUseCase } from '../../interface/driver/start_trip_use_case.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { ReservationStatus, ERROR_MESSAGES, DriverStatus } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { driverCooldownQueue } from '../../../../infrastructure/queue/driver_cooldown.queue';
import { container } from 'tsyringe';

const TERMINAL_STATUSES = new Set<ReservationStatus>([
  ReservationStatus.CANCELLED,
  ReservationStatus.COMPLETED,
  ReservationStatus.REFUNDED,
]);

/**
 * Use case for starting a trip
 * Driver explicitly starts a trip, setting startedAt timestamp
 */
@injectable()
export class StartTripUseCase implements IStartTripUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository
  ) {}

  async execute(driverId: string, reservationId: string): Promise<Reservation> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_DRIVER_ID', 400);
    }

    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Validate driver assignment
    if (!reservation.assignedDriverId || reservation.assignedDriverId !== driverId) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Validate reservation is not terminal
    if (TERMINAL_STATUSES.has(reservation.status)) {
      throw new AppError(
        `Cannot start trip. Reservation is ${reservation.status}`,
        'RESERVATION_TERMINAL',
        400
      );
    }

    // Validate trip is not already started
    if (reservation.startedAt) {
      throw new AppError('Trip has already been started', 'TRIP_ALREADY_STARTED', 400);
    }

    // Validate driver doesn't have another active trip
    const driverReservations = await this.reservationRepository.findByAssignedDriverId(driverId);
    const activeTrip = driverReservations.find(
      (r) => r.startedAt && !r.completedAt && r.reservationId !== reservationId
    );

    if (activeTrip) {
      throw new AppError(
        'Driver already has an active trip. Please end the current trip before starting a new one.',
        'DRIVER_HAS_ACTIVE_TRIP',
        400
      );
    }

    // Update reservation with startedAt
    const now = new Date();
    const update: Partial<import('../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel> = {
      startedAt: now,
    };

    await this.reservationRepository.updateById(reservationId, update);

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Update driver status to ON_TRIP
    try {
      const driver = await this.driverRepository.findById(driverId);
      if (!driver) {
        logger.warn(`Driver ${driverId} not found when updating status to ON_TRIP`);
      } else {
        const oldStatus = driver.status;
        await this.driverRepository.updateDriverStatus(driverId, DriverStatus.ON_TRIP);
        
        // Cancel any pending cooldown jobs for this driver
        // If driver starts a new trip during cooldown, the cooldown is no longer needed
        try {
          const jobs = await driverCooldownQueue.getJobs(['delayed', 'waiting']);
          for (const job of jobs) {
            if (job.data.driverId === driverId) {
              await job.remove();
              logger.info(`Cancelled pending cooldown job for driver ${driverId} (job ${job.id}) - driver started new trip`);
            }
          }
        } catch (cancelError) {
          // Don't fail trip start if job cancellation fails
          logger.error(`Error cancelling cooldown jobs for driver ${driverId}: ${cancelError instanceof Error ? cancelError.message : 'Unknown error'}`);
        }
        
        // Emit driver status changed event for admin visibility
        try {
          const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
          const updatedDriver = await this.driverRepository.findById(driverId);
          if (updatedDriver) {
            socketEventService.emitDriverStatusChanged(updatedDriver, oldStatus);
          }
        } catch (socketError) {
          // Don't fail trip start if socket emission fails
          logger.error('Error emitting driver status changed event:', socketError);
        }
        
        logger.info(`Driver ${driverId} status updated to ON_TRIP`);
      }
    } catch (driverStatusError) {
      // Log error but don't fail trip start
      logger.error(`Error updating driver status to ON_TRIP: ${driverStatusError instanceof Error ? driverStatusError.message : 'Unknown error'}`);
    }

    // Emit socket event
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      await socketEventService.emitTripStarted(updatedReservation.reservationId, driverId);
    } catch (error) {
      // Don't fail trip start if socket emission fails
      logger.error('Error emitting trip started event:', error);
    }

    logger.info(`Driver ${driverId} started trip: ${reservationId}`);

    return updatedReservation;
  }
}

