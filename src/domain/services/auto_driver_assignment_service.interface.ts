/**
 * Auto Driver Assignment Service Interface
 * Handles automatic driver assignment to quotes
 */
export interface IAutoDriverAssignmentService {
  /**
   * Attempts to assign an available driver to a specific quote
   * @param quoteId - The quote ID to assign a driver to
   * @returns true if driver was assigned, false otherwise
   */
  tryAssignDriverToQuote(quoteId: string): Promise<boolean>;

  /**
   * Processes all pending SUBMITTED quotes and attempts to assign drivers
   * @returns Number of quotes that were successfully assigned drivers
   */
  processPendingQuotes(): Promise<number>;
}
