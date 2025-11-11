import { UpdateQuoteDraftRequest, QuoteResponse } from '../../../dtos/quote.dto';

/**
 * Use case interface for updating a quote draft
 */
export interface IUpdateQuoteDraftUseCase {
  execute(quoteId: string, request: UpdateQuoteDraftRequest, userId: string): Promise<QuoteResponse>;
}

