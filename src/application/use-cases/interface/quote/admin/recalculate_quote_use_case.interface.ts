import { RecalculateQuoteResponse } from '../../../../dtos/quote.dto';

/**
 * Interface for recalculating quote use case
 */
export interface IRecalculateQuoteUseCase {
  /**
   * Recalculates quote pricing with current availability
   * Checks driver and vehicle availability, recalculates or notifies user
   * @param quoteId Quote ID
   * @returns Recalculation response
   */
  execute(quoteId: string): Promise<RecalculateQuoteResponse>;
}
