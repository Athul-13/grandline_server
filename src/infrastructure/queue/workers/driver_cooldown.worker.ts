import { Job } from 'bull';
import { driverCooldownQueue, DriverCooldownJobData } from '../driver_cooldown.queue';
import { IDriverRepository } from '../../../domain/repositories/driver_repository.interface';
import { IReservationRepository } from '../../../domain/repositories/reservation_repository.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../application/di/tokens';
import { DriverStatus } from '../../../shared/constants';
import { ISocketEventService } from '../../../domain/services/socket_event_service.interface';
import { logger } from '../../../shared/logger';
import { container } from 'tsyringe';

/**
 * Processes driver cooldown job
 * Sets driver status back to AVAILABLE after cooldown period
 * 
 * Safety checks:
 * - Job is idempotent (can be retried safely)
 * - Checks driver is still ON_TRIP before changing to AVAILABLE
 * - If driver started another trip, job is effectively cancelled (status won't change)
 */
async function processDriverCooldownJob(job: Job<DriverCooldownJobData>): Promise<void> {
  const { driverId, reservationId } = job.data;
  
  logger.info(`Processing driver cooldown job for driver ${driverId} (reservation ${reservationId})`);

  try {
    const driverRepository = container.resolve<IDriverRepository>(REPOSITORY_TOKENS.IDriverRepository);
    const reservationRepository = container.resolve<IReservationRepository>(REPOSITORY_TOKENS.IReservationRepository);
    
    // Fetch current driver state
    const driver = await driverRepository.findById(driverId);
    if (!driver) {
      logger.warn(`Driver ${driverId} not found during cooldown job processing`);
      return; // Driver doesn't exist, job is effectively cancelled
    }

    // Safety check: Only change status if driver is still ON_TRIP
    // If driver started another trip or status was manually changed, don't override
    if (driver.status !== DriverStatus.ON_TRIP) {
      logger.info(
        `Driver ${driverId} status is ${driver.status}, not ON_TRIP. Cooldown job cancelled (driver may have started another trip or status was manually changed).`
      );
      return; // Driver status changed, job is effectively cancelled
    }

    // Check if driver has any active trips
    const driverReservations = await reservationRepository.findByAssignedDriverId(driverId);
    const activeTrip = driverReservations.find(
      (r) => r.startedAt && !r.completedAt
    );

    // If driver has an active trip, don't change status
    if (activeTrip) {
      logger.info(
        `Driver ${driverId} has an active trip (${activeTrip.reservationId}). Cooldown job cancelled.`
      );
      return; // Driver started another trip, job is effectively cancelled
    }

    // All safety checks passed - update driver status to AVAILABLE
    const oldStatus = driver.status;
    const updatedDriver = await driverRepository.updateDriverStatus(driverId, DriverStatus.AVAILABLE);
    
    logger.info(`Driver ${driverId} cooldown completed. Status changed from ${oldStatus} to AVAILABLE`);

    // Emit driver status changed event for admin visibility
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      socketEventService.emitDriverStatusChanged(updatedDriver, oldStatus);
    } catch (socketError) {
      // Don't fail job if socket emission fails
      logger.error('Error emitting driver status changed event:', socketError);
    }

    // If driver is onboarded, trigger pending quotes job
    if (updatedDriver.isOnboarded) {
      try {
        // Note: This assumes there's a way to trigger pending quotes processing
        // You may need to adjust this based on your actual implementation
        logger.debug(`Driver ${driverId} is onboarded and available, pending quotes may be processed`);
      } catch (error) {
        logger.error(
          `Failed to trigger pending quotes job after driver ${driverId} cooldown: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  } catch (error) {
    logger.error(
      `Error processing driver cooldown job for driver ${driverId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error; // Re-throw to trigger Bull retry mechanism
  }
}

/**
 * Initialize driver cooldown worker
 * Processes jobs from the driver cooldown queue
 */
export function initializeDriverCooldownWorker(): void {
  void driverCooldownQueue.process('driver-cooldown', async (job: Job<DriverCooldownJobData>) => {
    return processDriverCooldownJob(job);
  });

  logger.info('Driver cooldown worker initialized');
}

