import { injectable } from 'tsyringe';
import { IQueueService } from '../../domain/services/queue_service.interface';
import { driverAssignmentQueue, AssignDriverJobData, ProcessPendingQuotesJobData } from '../queue/driver_assignment.queue';
import { logger } from '../../shared/logger';

/**
 * Queue Service Implementation
 * Adds jobs to Bull queues for driver assignment
 */
@injectable()
export class QueueServiceImpl implements IQueueService {
  async addDriverAssignmentJob(quoteId: string): Promise<void> {
    try {
      const jobData: AssignDriverJobData = {
        jobType: 'assign-driver',
        quoteId,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await driverAssignmentQueue.add(jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 30000, // 30 seconds
      });

      logger.info(`Added driver assignment job for quote: ${quoteId}`);
    } catch (error) {
      logger.error(
        `Failed to add driver assignment job for quote ${quoteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Don't throw - job addition failure shouldn't break the flow
    }
  }

  async addProcessPendingQuotesJob(): Promise<void> {
    try {
      const jobData: ProcessPendingQuotesJobData = {
        jobType: 'process-pending-quotes',
      };

      // Use jobId to prevent duplicate jobs
      // If a job with this ID already exists, it won't be added again
      const jobId = 'process-pending-quotes';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await driverAssignmentQueue.add(jobData, {
        jobId,
        removeOnComplete: true, // Remove completed jobs immediately
        removeOnFail: false, // Keep failed jobs for debugging
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        timeout: 60000, // 60 seconds for processing multiple quotes
      });

      logger.info('Added process pending quotes job');
    } catch (error) {
      logger.error(
        `Failed to add process pending quotes job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Don't throw - job addition failure shouldn't break the flow
    }
  }
}
