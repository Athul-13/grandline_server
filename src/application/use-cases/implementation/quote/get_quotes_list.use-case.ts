import { injectable, inject } from 'tsyringe';
import { IGetQuotesListUseCase } from '../../interface/quote/get_quotes_list_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IQuoteItineraryRepository } from '../../../../domain/repositories/quote_itinerary_repository.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { QuoteListResponse, QuoteListItemResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { QuoteMapper } from '../../../mapper/quote.mapper';
import { QuoteStatus, ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Allowed sort fields for quote sorting
 * Whitelist to prevent sorting by invalid fields
 */
const ALLOWED_SORT_FIELDS: readonly string[] = [
  'createdAt',
  'updatedAt',
  'status',
  'totalPrice',
  'tripName',
] as const;

/**
 * Use case for getting quotes list
 * Retrieves all quotes for a user with pagination
 */
@injectable()
export class GetQuotesListUseCase implements IGetQuotesListUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: QuoteStatus[],
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<QuoteListResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    // Normalize pagination parameters
    const normalizedPage = Math.max(1, Math.floor(page) || 1);
    const normalizedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20));

    // Validate sortBy field
    const normalizedSortBy = sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : undefined;
    
    // Validate sortOrder
    const normalizedSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

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

    // Filter out paid quotes (they are reservations, not quotes)
    quotes = quotes.filter((quote) => quote.status !== QuoteStatus.PAID);

    // Fetch itinerary for all quotes to get start and end locations
    const quoteIds = quotes.map((quote) => quote.quoteId);
    const allItineraryStops = await Promise.all(
      quoteIds.map((quoteId) => this.itineraryRepository.findByQuoteIdOrdered(quoteId))
    );

    // Create a map of quoteId -> itinerary stops for quick lookup
    const itineraryMap = new Map<string, typeof allItineraryStops[0]>();
    quoteIds.forEach((quoteId, index) => {
      itineraryMap.set(quoteId, allItineraryStops[index]);
    });

    // Check chat availability for all quotes
    const chatAvailabilityMap = new Map<string, { chatAvailable: boolean; chatId?: string }>();
    for (const quote of quotes) {
      const chatAvailable =
        quote.status === QuoteStatus.SUBMITTED ||
        quote.status === QuoteStatus.NEGOTIATING ||
        quote.status === QuoteStatus.ACCEPTED ||
        quote.status === QuoteStatus.QUOTED;

      let chatId: string | undefined;
      if (chatAvailable) {
        const chat = await this.chatRepository.findByContext('quote', quote.quoteId);
        if (chat) {
          chatId = chat.chatId;
        }
      }

      chatAvailabilityMap.set(quote.quoteId, { chatAvailable, chatId });
    }

    // Map to response DTOs before sorting (to access DTO fields)
    let quotesData = quotes.map((quote) => {
      const itineraryStops = itineraryMap.get(quote.quoteId);
      const response = QuoteMapper.toQuoteListItemResponse(quote, itineraryStops);
      const chatInfo = chatAvailabilityMap.get(quote.quoteId);
      if (chatInfo) {
        response.chatAvailable = chatInfo.chatAvailable;
        response.chatId = chatInfo.chatId;
      }
      return response;
    });

    // Apply sorting if sortBy is provided
    if (normalizedSortBy) {
      quotesData = this.sortQuotes(quotesData, normalizedSortBy, normalizedSortOrder);
    }

    // Calculate pagination
    const total = quotesData.length;
    const totalPages = Math.ceil(total / normalizedLimit);

    // Apply pagination
    const startIndex = (normalizedPage - 1) * normalizedLimit;
    const endIndex = startIndex + normalizedLimit;
    const paginatedQuotes = quotesData.slice(startIndex, endIndex);

    return {
      quotes: paginatedQuotes,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Sorts quotes array based on the specified field and order
   * Handles different data types (string, number, Date)
   */
  private sortQuotes(
    quotes: QuoteListItemResponse[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): QuoteListItemResponse[] {
    return [...quotes].sort((a, b) => {
      const aValue = a[sortBy as keyof QuoteListItemResponse];
      const bValue = b[sortBy as keyof QuoteListItemResponse];

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      // Handle Date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Fallback: convert to string and compare
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}

