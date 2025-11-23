import { AdminQuoteResponse } from '../../../../dtos/quote.dto';

/**
 * Use case interface for getting admin quote details
 */
export interface IGetAdminQuoteUseCase {
  execute(quoteId: string): Promise<AdminQuoteResponse>;
}

