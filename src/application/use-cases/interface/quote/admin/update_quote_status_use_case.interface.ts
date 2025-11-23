import { QuoteResponse } from '../../../../dtos/quote.dto';
import { UpdateQuoteStatusRequest } from '../../../../dtos/quote.dto';

/**
 * Use case interface for updating quote status
 */
export interface IUpdateQuoteStatusUseCase {
  execute(quoteId: string, request: UpdateQuoteStatusRequest): Promise<QuoteResponse>;
}

