import { AdminQuotesListResponse } from '../../../dtos/quote.dto';
import { QuoteStatus } from '../../../../shared/constants';

/**
 * Use case interface for getting admin quotes list
 */
export interface IGetAdminQuotesListUseCase {
  execute(
    page?: number,
    limit?: number,
    status?: QuoteStatus[],
    includeDeleted?: boolean,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<AdminQuotesListResponse>;
}

