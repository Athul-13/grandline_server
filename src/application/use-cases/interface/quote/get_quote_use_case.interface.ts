import { QuoteResponse } from '../../../dtos/quote.dto';

/**
 * Use case interface for getting a quote
 */
export interface IGetQuoteUseCase {
  execute(quoteId: string, userId: string): Promise<QuoteResponse>;
}

