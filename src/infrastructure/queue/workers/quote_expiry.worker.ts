import { Job } from 'bull';
import { container } from 'tsyringe';
import { quoteExpiryQueue, QuoteExpiryJobData } from '../quote_expiry.queue';
import { IQuoteRepository } from '../../../domain/repositories/quote_repository.interface';
import { REPOSITORY_TOKENS } from '../../../application/di/tokens';
import { QuoteStatus } from '../../../shared/constants';
import { logger } from '../../../shared/logger';
import { Quote } from '../../../domain/entities/quote.entity';
import { ISocketEventService } from '../../../domain/services/socket_event_service.interface';
import { SERVICE_TOKENS } from '../../../application/di/tokens';

/**
 * Quote Expiry Queue Worker
 * Processes jobs for automatic quote expiry after 24-hour payment window
 */
export class QuoteExpiryWorker {
  private quoteRepository: IQuoteRepository;

  constructor() {
    // Resolve repository from DI container
    this.quoteRepository = container.resolve<IQuoteRepository>(REPOSITORY_TOKENS.IQuoteRepository);
  }

  /**
   * Initialize the worker and set up job processors
   */
  initialize(): void {
    void quoteExpiryQueue.process(async (job: Job<QuoteExpiryJobData>) => {
      return this.processExpiryJob(job);
    });

    logger.info('Quote expiry worker initialized');
  }

  /**
   * Process quote expiry job
   * Idempotent: If quote status is not QUOTED, exit silently
   */
  private async processExpiryJob(job: Job<QuoteExpiryJobData>): Promise<boolean> {
    const { quoteId } = job.data;

    try {
      logger.info(`Processing quote expiry job for quote: ${quoteId} (Job ID: ${job.id})`);

      // Fetch quote by ID
      const quote = await this.quoteRepository.findById(quoteId);

      if (!quote) {
        logger.warn(`Quote not found for expiry job: ${quoteId} (Job ID: ${job.id})`);
        return false; // Exit silently - quote may have been deleted
      }

      // Idempotent check: If quote status is NOT QUOTED, exit silently
      if (quote.status !== QuoteStatus.QUOTED) {
        logger.info(
          `Quote ${quoteId} is not in QUOTED status (current: ${quote.status}), skipping expiry (Job ID: ${job.id})`
        );
        return false; // Exit silently - quote may have been paid or changed
      }

      // Set status to EXPIRED and clear driver assignment
      const expiredAt = new Date();
      await this.quoteRepository.updateById(quoteId, {
        status: QuoteStatus.EXPIRED,
        assignedDriverId: undefined, // Clear driver assignment
        actualDriverRate: undefined, // Clear driver rate
        // Keep quotedAt for audit trail
        // Keep pricing for audit trail
      } as Partial<Quote>);

      logger.info(`Quote ${quoteId} expired successfully (Job ID: ${job.id})`);

      // Emit socket event for real-time updates
      try {
        const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
        await socketEventService.emitQuoteExpired({
          quoteId,
          expiredAt,
        });
        logger.info(`Emitted quote:expired event for quote: ${quoteId}`);
      } catch (socketError) {
        // Don't fail expiry if socket emission fails
        logger.error(
          `Failed to emit quote:expired event for quote ${quoteId}: ${socketError instanceof Error ? socketError.message : 'Unknown error'}`
        );
      }

      return true;
    } catch (error) {
      logger.error(
        `Error processing quote expiry job for quote ${quoteId} (Job ID: ${job.id}): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Don't throw - expiry failures shouldn't retry indefinitely
      return false;
    }
  }
}

