import { QuoteListResponse } from '../../../dtos/quote.dto';
import { QuoteStatus } from '../../../../shared/constants';

/**
 * Use case interface for getting quotes list
 */
export interface IGetQuotesListUseCase {
  execute(
    userId: string,
    page?: number,
    limit?: number,
    status?: QuoteStatus[]
  ): Promise<QuoteListResponse>;
}

