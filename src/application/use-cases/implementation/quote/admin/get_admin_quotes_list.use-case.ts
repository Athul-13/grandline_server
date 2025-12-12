import { injectable, inject } from 'tsyringe';
import { IGetAdminQuotesListUseCase } from '../../../interface/quote/admin/get_admin_quotes_list_use_case.interface';
import { IQuoteRepository } from '../../../../../domain/repositories/quote_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { IChatRepository } from '../../../../../domain/repositories/chat_repository.interface';
import { AdminQuotesListResponse, AdminQuoteListItemResponse } from '../../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { QuoteMapper } from '../../../../mapper/quote.mapper';
import { QuoteStatus } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { User } from '../../../../../domain/entities/user.entity';

/**
 * Allowed sort fields for admin quote sorting
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
 * Use case for getting admin quotes list
 * Retrieves all quotes with filtering, sorting, and pagination
 */
@injectable()
export class GetAdminQuotesListUseCase implements IGetAdminQuotesListUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository
  ) {}

  async execute(
    page: number = 1,
    limit: number = 20,
    status?: QuoteStatus[],
    includeDeleted: boolean = false,
    search?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<AdminQuotesListResponse> {
    try {
      // Normalize pagination parameters
      const normalizedPage = Math.max(1, Math.floor(page) || 1);
      const normalizedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20));

      // Validate sortBy field
      const normalizedSortBy = sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : undefined;
      const normalizedSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      // Normalize search term
      const normalizedSearch = search && search.trim().length > 0 ? search.trim() : undefined;

      logger.info(
        `Admin quotes list request: page=${normalizedPage}, limit=${normalizedLimit}, status=${status?.join(',') || 'all'}, includeDeleted=${includeDeleted}, search=${normalizedSearch || 'none'}`
      );

      // Step 1: Get quotes based on filters
      let quotes = await this.quoteRepository.findAllForAdmin(includeDeleted, status);

      // Step 2: If search is provided, filter by user name/email
      let matchingUserIds: string[] = [];
      if (normalizedSearch) {
        const searchLower = normalizedSearch.toLowerCase();
        const allUsersResult = await this.userRepository.findAll();
        const allUsers = allUsersResult;
        matchingUserIds = allUsers
          .filter(
            (user) =>
              user.fullName.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)
          )
          .map((user) => user.userId);

        // If we found matching users, get their quotes and combine
        if (matchingUserIds.length > 0) {
          const quotesByUsers = await this.quoteRepository.findAllForAdmin(
            includeDeleted,
            status,
            matchingUserIds
          );
          // Combine and deduplicate by quoteId
          const existingQuoteIds = new Set(quotes.map((q) => q.quoteId));
          const additionalQuotes = quotesByUsers.filter(
            (quote) => !existingQuoteIds.has(quote.quoteId)
          );
          quotes = [...quotes, ...additionalQuotes];
        } else {
          // No matching users, return empty result
          quotes = [];
        }
      }

      // Step 3: Fetch user information for all quotes
      const userIds = [...new Set(quotes.map((quote) => quote.userId))];
      const usersMap = new Map<string, User>();

      for (const userId of userIds) {
        try {
          const user = await this.userRepository.findById(userId);
          if (user) {
            usersMap.set(userId, user);
          }
        } catch {
          logger.warn(`User not found for quote: ${userId}`);
        }
      }

      // Step 4: Check chat availability for all quotes
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

      // Step 5: Map quotes to admin response DTOs with user information
      const quotesWithUsers: AdminQuoteListItemResponse[] = [];
      for (const quote of quotes) {
        const user = usersMap.get(quote.userId);
        if (!user) {
          logger.warn(`Skipping quote ${quote.quoteId} - user ${quote.userId} not found`);
          continue;
        }

        // If search is provided, do final in-memory filter for quote fields
        if (normalizedSearch) {
          const searchLower = normalizedSearch.toLowerCase();
          const quoteMatches =
            quote.quoteId.toLowerCase().includes(searchLower) ||
            (quote.tripName && quote.tripName.toLowerCase().includes(searchLower)) ||
            (quote.eventType && quote.eventType.toLowerCase().includes(searchLower)) ||
            (quote.customEventType && quote.customEventType.toLowerCase().includes(searchLower));

          const userMatches =
            user.fullName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower);

          // Skip if neither quote fields nor user fields match
          if (!quoteMatches && !userMatches) {
            continue;
          }
        }

        const quoteListItem = QuoteMapper.toQuoteListItemResponse(quote);
        const chatInfo = chatAvailabilityMap.get(quote.quoteId);
        quotesWithUsers.push({
          ...quoteListItem,
          chatAvailable: chatInfo?.chatAvailable,
          chatId: chatInfo?.chatId,
          user: {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
          },
        });
      }

      // Step 6: Apply sorting
      // If no sortBy provided, default to newest first (createdAt desc)
      let sortedQuotes = quotesWithUsers;
      if (normalizedSortBy) {
        sortedQuotes = this.sortQuotes(quotesWithUsers, normalizedSortBy, normalizedSortOrder);
      } else {
        // Default: sort by createdAt descending (newest first)
        sortedQuotes = this.sortQuotes(quotesWithUsers, 'createdAt', 'desc');
      }

      // Step 7: Calculate pagination
      const total = sortedQuotes.length;
      const totalPages = Math.ceil(total / normalizedLimit);

      // Step 8: Apply pagination
      const startIndex = (normalizedPage - 1) * normalizedLimit;
      const endIndex = startIndex + normalizedLimit;
      const paginatedQuotes = sortedQuotes.slice(startIndex, endIndex);

      logger.info(`Admin quotes list: returning ${paginatedQuotes.length} quotes out of ${total} total`);

      return {
        quotes: paginatedQuotes,
        pagination: {
          page: normalizedPage,
          limit: normalizedLimit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(
        `Error fetching admin quotes list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to fetch admin quotes list', 'ADMIN_QUOTES_LIST_ERROR', 500);
    }
  }

  /**
   * Sorts quotes array based on the specified field and order
   * Handles different data types (string, number, Date)
   */
  private sortQuotes(
    quotes: AdminQuoteListItemResponse[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): AdminQuoteListItemResponse[] {
    return [...quotes].sort((a, b) => {
      const aValue = a[sortBy as keyof AdminQuoteListItemResponse];
      const bValue = b[sortBy as keyof AdminQuoteListItemResponse];

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
      // Handle objects by converting to JSON string for comparison
      const aStr = typeof aValue === 'object' ? JSON.stringify(aValue) : String(aValue);
      const bStr = typeof bValue === 'object' ? JSON.stringify(bValue) : String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}

