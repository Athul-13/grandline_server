
import { IQueueService } from '../../../domain/services/queue_service.interface';
import { SERVICE_TOKENS } from '../../../application/di/tokens';
import { container } from 'tsyringe';
import { logger } from '../../../shared/logger';

/**
 * Driver Assignment Scheduler
 * Schedules periodic jobs to process pending quotes
 */
export class DriverAssignmentScheduler {
  private queueService: IQueueService;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Resolve service from DI container
    this.queueService = container.resolve<IQueueService>(SERVICE_TOKENS.IQueueService);
  }

  /**
   * Start the scheduler
   * Adds a process-pending-quotes job every 10 minutes
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('Driver assignment scheduler is already running');
      return;
    }

    // Add initial job immediately
    this.queueService.addProcessPendingQuotesJob().catch((error) => {
      logger.error(`Failed to add initial pending quotes job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });

    // Schedule recurring job every 10 minutes
    this.intervalId = setInterval(() => {
      this.queueService.addProcessPendingQuotesJob().catch((error) => {
        logger.error(`Failed to add scheduled pending quotes job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });
    }, this.INTERVAL_MS);

    logger.info(`Driver assignment scheduler started (interval: ${this.INTERVAL_MS / 1000 / 60} minutes)`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Driver assignment scheduler stopped');
    }
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
