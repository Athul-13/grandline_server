import { injectable, inject } from 'tsyringe';
import { IGetQuotesListUseCase } from '../../interface/quote/get_quotes_list_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { QuoteListResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { QuoteMapper } from '../../../mapper/quote.mapper';
import { QuoteStatus } from '../../../../shared/constants';

/**
 * Use case for getting quotes list
 * Retrieves all quotes for a user with pagination
 */
@injectable()
export class GetQuotesListUseCase implements IGetQuotesListUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: QuoteStatus[]
  ): Promise<QuoteListResponse> {
    // Normalize pagination parameters
    const normalizedPage = Math.max(1, Math.floor(page) || 1);
    const normalizedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20));

    // Get quotes
    let quotes;
    if (status && status.length > 0) {
      // Filter by status
      quotes = await Promise.all(
        status.map((s) => this.quoteRepository.findByUserIdAndStatus(userId, s))
      );
      quotes = quotes.flat();
    } else {
      // Get all active quotes
      quotes = await this.quoteRepository.findActiveQuotesByUserId(userId);
    }

    // Calculate pagination
    const total = quotes.length;
    const totalPages = Math.ceil(total / normalizedLimit);

    // Apply pagination
    const startIndex = (normalizedPage - 1) * normalizedLimit;
    const endIndex = startIndex + normalizedLimit;
    const paginatedQuotes = quotes.slice(startIndex, endIndex);

    return {
      quotes: paginatedQuotes.map((quote) => QuoteMapper.toQuoteListItemResponse(quote)),
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    };
  }
}

