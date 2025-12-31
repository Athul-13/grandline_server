/**
 * Queue Service Interface
 * Handles adding jobs to Bull queues
 */
export interface IQueueService {
  /**
   * Adds a job to assign a driver to a specific quote
   * @param quoteId - The quote ID to assign a driver to
   */
  addDriverAssignmentJob(quoteId: string): Promise<void>;

  /**
   * Adds a job to process all pending SUBMITTED quotes
   */
  addProcessPendingQuotesJob(): Promise<void>;

  /**
   * Initializes the repeatable process-pending-quotes job
   * This creates a persistent scheduled job that runs every 10 minutes
   */
  initializeProcessPendingQuotesRepeatJob(): Promise<void>;

  /**
   * Adds a delayed job to expire a quote after 24 hours
   * @param quoteId - The quote ID to expire
   * @param quotedAt - The timestamp when the quote was quoted (24 hours from this)
   */
  addQuoteExpiryJob(quoteId: string, quotedAt: Date): Promise<void>;
}
