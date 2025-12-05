import { QuoteResponse, AssignDriverToQuoteRequest } from '../../../../dtos/quote.dto';

/**
 * Interface for assigning driver to quote use case
 */
export interface IAssignDriverToQuoteUseCase {
  /**
   * Assigns a driver to a quote, recalculates pricing, generates PDF, and sends email
   * @param quoteId Quote ID
   * @param request Driver assignment request
   * @returns Updated quote response
   */
  execute(quoteId: string, request: AssignDriverToQuoteRequest): Promise<QuoteResponse>;
}
