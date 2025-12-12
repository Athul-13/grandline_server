import { Job } from 'bull';
import { container } from 'tsyringe';
import { driverAssignmentQueue, DriverAssignmentJobData } from '../driver_assignment.queue';
import { IAutoDriverAssignmentService } from '../../../domain/services/auto_driver_assignment_service.interface';
import { SERVICE_TOKENS } from '../../../application/di/tokens';
import { logger } from '../../../shared/logger';

/**
 * Driver Assignment Queue Worker
 * Processes jobs for automatic driver assignment
 */
export class DriverAssignmentWorker {
  private autoAssignmentService: IAutoDriverAssignmentService;

  constructor() {
    // Resolve service from DI container
    this.autoAssignmentService = container.resolve<IAutoDriverAssignmentService>(
      SERVICE_TOKENS.IAutoDriverAssignmentService
    );
  }

  /**
   * Initialize the worker and set up job processors
   */
  initialize(): void {
    // Process all jobs - check jobType in handler
    void driverAssignmentQueue.process(async (job: Job<DriverAssignmentJobData>) => {
      if (job.data.jobType === 'assign-driver') {
        return this.processAssignDriverJob(job);
      } else if (job.data.jobType === 'process-pending-quotes') {
        return this.processPendingQuotesJob(job);
      } else {
        throw new Error(`Unknown job type: ${(job.data as { jobType?: string }).jobType}`);
      }
    });

    logger.info('Driver assignment worker initialized');
  }

  /**
   * Process assign-driver job
   */
  private async processAssignDriverJob(job: Job<DriverAssignmentJobData>): Promise<boolean> {
    const { quoteId } = job.data as { quoteId: string };

    try {
      logger.info(`Processing assign-driver job for quote: ${quoteId} (Job ID: ${job.id})`);

      const assigned = await this.autoAssignmentService.tryAssignDriverToQuote(quoteId);

      if (assigned) {
        logger.info(`Successfully assigned driver to quote ${quoteId} (Job ID: ${job.id})`);
        return true;
      } else {
        logger.info(`No driver available for quote ${quoteId} (Job ID: ${job.id})`);
        return false;
      }
    } catch (error) {
      logger.error(
        `Error processing assign-driver job for quote ${quoteId} (Job ID: ${job.id}): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Process process-pending-quotes job
   */
  private async processPendingQuotesJob(job: Job<DriverAssignmentJobData>): Promise<number> {
    try {
      logger.info(`Processing pending quotes job (Job ID: ${job.id})`);

      const assignedCount = await this.autoAssignmentService.processPendingQuotes();

      logger.info(`Processed pending quotes job: ${assignedCount} quotes assigned (Job ID: ${job.id})`);
      return assignedCount;
    } catch (error) {
      logger.error(
        `Error processing pending quotes job (Job ID: ${job.id}): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  }
}
