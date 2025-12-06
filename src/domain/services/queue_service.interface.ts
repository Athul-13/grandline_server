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
}
