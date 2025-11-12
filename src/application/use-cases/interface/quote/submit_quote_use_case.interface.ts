import { SubmitQuoteResponse } from '../../../dtos/quote.dto';

/**
 * Use case interface for submitting a quote
 */
export interface ISubmitQuoteUseCase {
  execute(quoteId: string, userId: string): Promise<SubmitQuoteResponse>;
}

