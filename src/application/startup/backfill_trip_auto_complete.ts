import { container } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../di/tokens';
import { IReservationRepository } from '../../domain/repositories/reservation_repository.interface';
import { IReservationItineraryRepository } from '../../domain/repositories/reservation_itinerary_repository.interface';
import { tripAutoCompleteQueue } from '../../infrastructure/queue/trip_auto_complete.queue';
import { deriveTripWindow } from '../mapper/driver_dashboard.mapper';
import { logger } from '../../shared/logger';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Backfill script for existing ongoing trips
 * Schedules auto-complete jobs for trips that are already started but not completed
 * This should be run once at server startup to handle trips that were active before this feature was added
 */
export async function backfillTripAutoCompleteJobs(): Promise<void> {
  try {
    logger.info('Starting backfill for trip auto-complete jobs');

    const reservationRepository = container.resolve<IReservationRepository>(REPOSITORY_TOKENS.IReservationRepository);
    const itineraryRepository = container.resolve<IReservationItineraryRepository>(
      REPOSITORY_TOKENS.IReservationItineraryRepository
    );

    // Find all active trips (started but not completed)
    const activeTrips = await reservationRepository.findActiveTrips();

    if (activeTrips.length === 0) {
      logger.info('No active trips found for backfill');
      return;
    }

    logger.info(`Found ${activeTrips.length} active trips for backfill`);

    let scheduledCount = 0;
    let skippedCount = 0;

    for (const trip of activeTrips) {
      try {
        // Get itinerary to calculate tripEndAt
        const itineraryStops = await itineraryRepository.findByReservationIdOrdered(trip.reservationId);

        if (itineraryStops.length === 0) {
          logger.warn(`Reservation ${trip.reservationId} has no itinerary, skipping backfill`);
          skippedCount++;
          continue;
        }

        const { tripEndAt } = deriveTripWindow(itineraryStops);
        const graceEnd = tripEndAt.getTime() + ONE_DAY_MS;
        const delay = graceEnd - Date.now();

        // Check if job already exists
        const existingJobs = await tripAutoCompleteQueue.getJobs(['delayed', 'waiting', 'active']);
        const existingJob = existingJobs.find((job) => job.data.reservationId === trip.reservationId);
        if (existingJob) {
          logger.debug(`Auto-complete job already exists for reservation ${trip.reservationId}, skipping`);
          skippedCount++;
          continue;
        }

        if (delay <= 0) {
          // Grace period already passed - enqueue immediate job
          await tripAutoCompleteQueue.add(
            { reservationId: trip.reservationId },
            {
              jobId: `auto-complete-${trip.reservationId}`,
            }
          );
          logger.debug(`Scheduled immediate auto-complete job for reservation ${trip.reservationId} (grace period already passed)`);
        } else {
          // Schedule delayed job
          await tripAutoCompleteQueue.add(
            { reservationId: trip.reservationId },
            {
              delay,
              jobId: `auto-complete-${trip.reservationId}`,
            }
          );
          logger.debug(`Scheduled auto-complete job for reservation ${trip.reservationId} (delay: ${delay}ms)`);
        }

        scheduledCount++;
      } catch (error) {
        logger.error(
          `Error processing backfill for reservation ${trip.reservationId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        skippedCount++;
      }
    }

    logger.info(
      `Backfill completed: ${scheduledCount} jobs scheduled, ${skippedCount} skipped out of ${activeTrips.length} active trips`
    );
  } catch (error) {
    logger.error(
      `Error during trip auto-complete backfill: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    // Don't throw - backfill failure shouldn't prevent server startup
  }
}

