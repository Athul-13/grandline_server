import { Job } from 'bull';
import { container } from 'tsyringe';
import { tripAutoCompleteQueue, TripAutoCompleteJobData } from '../trip_auto_complete.queue';
import { IReservationRepository } from '../../../domain/repositories/reservation_repository.interface';
import { IReservationItineraryRepository } from '../../../domain/repositories/reservation_itinerary_repository.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../application/di/tokens';
import { ReservationStatus } from '../../../shared/constants';
import { logger } from '../../../shared/logger';
import { deriveTripWindow } from '../../../application/mapper/driver_dashboard.mapper';
import { ISocketEventService } from '../../../domain/services/socket_event_service.interface';
import { driverCooldownQueue } from '../driver_cooldown.queue';
import { DRIVER_ASSIGNMENT_CONFIG } from '../../../shared/constants';
import { IRedisConnection } from '../../../domain/services/redis_connection.interface';
import { CONFIG_TOKENS } from '../../../infrastructure/di/tokens';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Trip Auto-Complete Queue Worker
 * Processes jobs for automatic trip completion after grace period
 */
export class TripAutoCompleteWorker {
  private reservationRepository: IReservationRepository;
  private itineraryRepository: IReservationItineraryRepository;

  constructor() {
    // Resolve repositories from DI container
    this.reservationRepository = container.resolve<IReservationRepository>(REPOSITORY_TOKENS.IReservationRepository);
    this.itineraryRepository = container.resolve<IReservationItineraryRepository>(
      REPOSITORY_TOKENS.IReservationItineraryRepository
    );
  }

  /**
   * Initialize the worker and set up job processors
   */
  initialize(): void {
    void tripAutoCompleteQueue.process(async (job: Job<TripAutoCompleteJobData>) => {
      return this.processTripAutoCompleteJob(job);
    });

    logger.info('Trip auto-complete worker initialized');
  }

  /**
   * Process trip auto-complete job
   * Idempotent: If trip is already completed or not started, exit silently
   */
  private async processTripAutoCompleteJob(job: Job<TripAutoCompleteJobData>): Promise<boolean> {
    const { reservationId } = job.data;

    try {
      logger.info(`Processing trip auto-complete job for reservation: ${reservationId} (Job ID: ${job.id})`);

      // Fetch reservation by ID
      const reservation = await this.reservationRepository.findById(reservationId);

      if (!reservation) {
        logger.warn(`Reservation not found for auto-complete job: ${reservationId} (Job ID: ${job.id})`);
        return false; // Exit silently - reservation may have been deleted
      }

      // Safety exits - idempotent checks
      if (!reservation.startedAt) {
        logger.info(
          `Reservation ${reservationId} has not been started, skipping auto-complete (Job ID: ${job.id})`
        );
        return false; // Exit silently - trip not started
      }

      if (reservation.completedAt) {
        logger.info(
          `Reservation ${reservationId} is already completed, skipping auto-complete (Job ID: ${job.id})`
        );
        return false; // Exit silently - already completed
      }

      // Get itinerary to calculate tripEndAt
      const itineraryStops = await this.itineraryRepository.findByReservationIdOrdered(reservationId);
      if (itineraryStops.length === 0) {
        logger.warn(`Reservation ${reservationId} has no itinerary, skipping auto-complete (Job ID: ${job.id})`);
        return false; // Exit silently - no itinerary
      }

      const { tripEndAt } = deriveTripWindow(itineraryStops);
      const graceEnd = new Date(tripEndAt.getTime() + ONE_DAY_MS);

      // Check if grace period has passed
      if (Date.now() < graceEnd.getTime()) {
        logger.info(
          `Reservation ${reservationId} grace period not over yet (ends at ${graceEnd.toISOString()}), skipping auto-complete (Job ID: ${job.id})`
        );
        return false; // Grace period not over - do nothing
      }

      // Auto-complete the trip
      const completedAt = new Date();
      await this.reservationRepository.updateById(reservationId, {
        completedAt,
        status: ReservationStatus.COMPLETED,
      });

      logger.info(`Trip auto-completed after grace period: ${reservationId} (Job ID: ${job.id})`);

      // Fetch updated reservation for cooldown and socket events
      const updatedReservation = await this.reservationRepository.findById(reservationId);
      if (!updatedReservation) {
        logger.warn(`Reservation ${reservationId} not found after update (Job ID: ${job.id})`);
        return false;
      }

      // Clear location data from Redis
      try {
        const redis = container.resolve<IRedisConnection>(CONFIG_TOKENS.RedisConnection);
        const latestLocationKey = `location:latest:${reservationId}`;
        const throttleKey = `location:throttle:${updatedReservation.assignedDriverId}:${reservationId}`;

        await redis.del(latestLocationKey);
        if (updatedReservation.assignedDriverId) {
          await redis.del(throttleKey);
        }

        logger.debug(`Cleared location data for reservation ${reservationId}`);
      } catch (error) {
        // Don't fail auto-complete if location cleanup fails
        logger.error('Error clearing location data:', error);
      }

      // Schedule driver cooldown job (24 hours delay)
      if (updatedReservation.assignedDriverId) {
        try {
          await driverCooldownQueue.add(
            'driver-cooldown',
            {
              jobType: 'driver-cooldown',
              driverId: updatedReservation.assignedDriverId,
              reservationId,
            },
            {
              delay: DRIVER_ASSIGNMENT_CONFIG.COOLDOWN_PERIOD_MS,
              jobId: `cooldown-${updatedReservation.assignedDriverId}-${reservationId}`,
              removeOnComplete: true,
            }
          );
        } catch (cooldownError) {
          // Don't fail auto-complete if job scheduling fails
          logger.error(
            `Error scheduling driver cooldown job for driver ${updatedReservation.assignedDriverId}: ${cooldownError instanceof Error ? cooldownError.message : 'Unknown error'}`
          );
        }
      }

      // Emit socket event
      try {
        const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
        if (updatedReservation.assignedDriverId) {
          await socketEventService.emitTripEnded(reservationId, updatedReservation.assignedDriverId);
        }
      } catch (socketError) {
        // Don't fail auto-complete if socket emission fails
        logger.error(
          `Failed to emit trip:ended event for reservation ${reservationId}: ${socketError instanceof Error ? socketError.message : 'Unknown error'}`
        );
      }

      return true;
    } catch (error) {
      logger.error(
        `Error processing trip auto-complete job for reservation ${reservationId} (Job ID: ${job.id}): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Don't throw - auto-complete failures shouldn't retry indefinitely
      return false;
    }
  }
}

