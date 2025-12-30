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

      await driverAssignmentQueue.add(jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        timeout: 30000, // 30 seconds
      });
      // No log - event-driven jobs don't need enqueue confirmation
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

      await driverAssignmentQueue.add(jobData, {
        jobId: 'process-pending-quotes', // Fixed jobId for repeatable job
        removeOnComplete: true, // Remove completed jobs immediately
        removeOnFail: false, // Keep failed jobs for debugging
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        timeout: 60000, // 60 seconds for processing multiple quotes
      });
      // No log - repeatable jobs don't need enqueue confirmation
    } catch (error) {
      logger.error(
        `Failed to add process pending quotes job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Don't throw - job addition failure shouldn't break the flow
    }
  }

  /**
   * Initialize the repeatable process-pending-quotes job
   * This replaces the setInterval-based scheduler
   * The job will run every 10 minutes and persist across server restarts
   */
  async initializeProcessPendingQuotesRepeatJob(): Promise<void> {
    try {
      const jobData: ProcessPendingQuotesJobData = {
        jobType: 'process-pending-quotes',
      };

      await driverAssignmentQueue.add(
        jobData,
        {
          jobId: 'process-pending-quotes',
          repeat: {
            every: 10 * 60 * 1000, // 10 minutes in milliseconds
          },
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          timeout: 60000, // 60 seconds for processing multiple quotes
        }
      );

      logger.info('Process pending quotes repeat job initialized (runs every 10 minutes)');
    } catch (error) {
      logger.error(
        `Failed to initialize process pending quotes repeat job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error; // This is a critical initialization failure
    }
  }
}
