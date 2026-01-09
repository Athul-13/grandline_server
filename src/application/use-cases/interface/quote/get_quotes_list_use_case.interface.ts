import { QuoteListResponse } from '../../../dtos/quote.dto';
import { QuoteStatus } from '../../../../shared/constants';

/**
 * Minimal quote dropdown response
 */
export interface QuoteDropdownItem {
  quoteId: string;
  quoteNumber: string;
  tripName: string;
  status: QuoteStatus;
}

/**
 * Use case interface for getting quotes list
 */
export interface IGetQuotesListUseCase {
  execute(
    userId: string,
    page?: number,
    limit?: number,
    status?: QuoteStatus[],
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    forDropdown?: boolean
  ): Promise<QuoteListResponse | QuoteDropdownItem[]>;
}

