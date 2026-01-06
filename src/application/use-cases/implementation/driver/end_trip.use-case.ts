import { inject, injectable } from 'tsyringe';
import { IEndTripUseCase } from '../../interface/driver/end_trip_use_case.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS, USE_CASE_TOKENS } from '../../../di/tokens';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IReservationChargeRepository } from '../../../../domain/repositories/reservation_charge_repository.interface';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { ReservationStatus, ERROR_MESSAGES, DRIVER_ASSIGNMENT_CONFIG } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { IRedisConnection } from '../../../../domain/services/redis_connection.interface';
import { CONFIG_TOKENS } from '../../../../infrastructure/di/tokens';
import { driverCooldownQueue } from '../../../../infrastructure/queue/driver_cooldown.queue';
import { tripAutoCompleteQueue } from '../../../../infrastructure/queue/trip_auto_complete.queue';
import { container } from 'tsyringe';
import { CalculateDriverEarningsUseCase } from './calculate_driver_earnings.use-case';

/**
 * Use case for ending a trip
 * Driver explicitly ends a trip, setting completedAt timestamp
 */
@injectable()
export class EndTripUseCase implements IEndTripUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository,
    @inject(USE_CASE_TOKENS.CalculateDriverEarningsUseCase)
    private readonly calculateDriverEarningsUseCase: CalculateDriverEarningsUseCase
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

    // Validate trip is already started
    if (!reservation.startedAt) {
      throw new AppError('Trip has not been started yet', 'TRIP_NOT_STARTED', 400);
    }

    // Validate trip is not already completed
    if (reservation.completedAt) {
      throw new AppError('Trip has already been completed', 'TRIP_ALREADY_COMPLETED', 400);
    }

    // Cancel auto-complete job if it exists (driver is ending trip manually)
    try {
      const jobs = await tripAutoCompleteQueue.getJobs(['delayed', 'waiting', 'active']);
      for (const job of jobs) {
        if (job.data.reservationId === reservationId) {
          await job.remove();
          logger.debug(`Cancelled auto-complete job for reservation ${reservationId} (driver ended trip manually)`);
          break; // Only one job per reservation
        }
      }
    } catch (cancelError) {
      // Don't fail trip end if job cancellation fails
      logger.error(
        `Error cancelling auto-complete job for reservation ${reservationId}: ${cancelError instanceof Error ? cancelError.message : 'Unknown error'}`
      );
    }

    // Check for unpaid charges - block completion if any exist
    const unpaidCharges = await this.chargeRepository.findUnpaidByReservationId(reservationId);
    if (unpaidCharges.length > 0) {
      const totalUnpaid = unpaidCharges.reduce((sum, charge) => sum + charge.amount, 0);
      throw new AppError(
        `Cannot complete trip with unpaid balance of ${totalUnpaid} ${unpaidCharges[0]?.currency || 'INR'}. Please ensure all charges are paid before completing the trip.`,
        'UNPAID_CHARGES_BLOCK_COMPLETION',
        400
      );
    }

    // Update reservation with completedAt and optionally status to COMPLETED
    const now = new Date();
    const update: Partial<import('../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel> = {
      completedAt: now,
      // Optionally update status to COMPLETED if not already terminal
      ...(reservation.status !== ReservationStatus.CANCELLED &&
      reservation.status !== ReservationStatus.REFUNDED
        ? { status: ReservationStatus.COMPLETED }
        : {}),
    };

    await this.reservationRepository.updateById(reservationId, update);

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Clear location data from Redis
    try {
      const redis = container.resolve<IRedisConnection>(CONFIG_TOKENS.RedisConnection);
      const latestLocationKey = `location:latest:${reservationId}`;
      const throttleKey = `location:throttle:${driverId}:${reservationId}`;
      
      await redis.del(latestLocationKey);
      await redis.del(throttleKey);
      
      logger.debug(`Cleared location data for reservation ${reservationId}`);
    } catch (error) {
      // Don't fail trip end if location cleanup fails
      logger.error('Error clearing location data:', error);
    }

    // Schedule driver cooldown job (24 hours delay)
    // Driver status remains ON_TRIP during cooldown, then becomes AVAILABLE
    try {
      await driverCooldownQueue.add(
        'driver-cooldown',
        {
          jobType: 'driver-cooldown',
          driverId,
          reservationId,
        },
        {
          delay: DRIVER_ASSIGNMENT_CONFIG.COOLDOWN_PERIOD_MS,
          jobId: `cooldown-${driverId}-${reservationId}`, // Unique job ID to prevent duplicates
          removeOnComplete: true,
        }
      );
      // No log - delayed jobs don't need enqueue confirmation
    } catch (cooldownError) {
      // Don't fail trip end if job scheduling fails
      logger.error(
        `Error scheduling driver cooldown job for driver ${driverId}: ${cooldownError instanceof Error ? cooldownError.message : 'Unknown error'}`
      );
    }

    // Emit socket event
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      await socketEventService.emitTripEnded(updatedReservation.reservationId, driverId);
    } catch (error) {
      // Don't fail trip end if socket emission fails
      logger.error('Error emitting trip ended event:', error);
    }

    // Calculate driver earnings (non-blocking - don't fail trip end if this fails)
    try {
      await this.calculateDriverEarningsUseCase.execute(reservationId);
    } catch (earningsError) {
      // Log error but don't fail trip end
      logger.error(
        `Error calculating driver earnings for reservation ${reservationId}: ${earningsError instanceof Error ? earningsError.message : 'Unknown error'}`
      );
    }

    logger.info(`Driver ${driverId} ended trip: ${reservationId}. Cooldown period started (24 hours)`);

    return updatedReservation;
  }
}

