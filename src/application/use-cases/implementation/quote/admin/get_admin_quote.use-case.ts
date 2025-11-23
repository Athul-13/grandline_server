import { injectable, inject } from 'tsyringe';
import { IGetAdminQuoteUseCase } from '../../../interface/quote/admin/get_admin_quote_use_case.interface';
import { IQuoteRepository } from '../../../../../domain/repositories/quote_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { IQuoteItineraryRepository } from '../../../../../domain/repositories/quote_itinerary_repository.interface';
import { IPassengerRepository } from '../../../../../domain/repositories/passenger_repository.interface';
import { IChatRepository } from '../../../../../domain/repositories/chat_repository.interface';
import { AdminQuoteResponse } from '../../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../../../infrastructure/di/tokens';
import { QuoteMapper } from '../../../../mapper/quote.mapper';
import { ERROR_MESSAGES, ERROR_CODES, QuoteStatus } from '../../../../../shared/constants';
import { logger } from '../../../../../shared/logger';
import { AppError } from '../../../../../shared/utils/app_error.util';

/**
 * Use case for getting admin quote details
 * Retrieves a single quote by ID with user information (no ownership check)
 */
@injectable()
export class GetAdminQuoteUseCase implements IGetAdminQuoteUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository,
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository
  ) {}

  async execute(quoteId: string): Promise<AdminQuoteResponse> {
    // Input validation
    if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
    }

    // Fetch quote (no ownership check for admin)
    const quote = await this.quoteRepository.findById(quoteId);

    if (!quote) {
      logger.warn(`Admin attempted to get non-existent quote: ${quoteId}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Fetch user information
    const user = await this.userRepository.findById(quote.userId);
    if (!user) {
      logger.error(`User not found for quote: ${quoteId}, userId: ${quote.userId}`);
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Fetch itinerary and passengers
    const itineraryStops = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
    const passengers = await this.passengerRepository.findByQuoteId(quoteId);

    // Map to response DTO
    const quoteResponse = QuoteMapper.toQuoteResponse(quote, itineraryStops, passengers);

    // Check chat availability (available when status is SUBMITTED or later)
    const chatAvailable =
      quote.status === QuoteStatus.SUBMITTED ||
      quote.status === QuoteStatus.NEGOTIATING ||
      quote.status === QuoteStatus.ACCEPTED ||
      quote.status === QuoteStatus.QUOTED;

    // Check if chat exists for this quote
    let chatId: string | undefined;
    if (chatAvailable) {
      const chat = await this.chatRepository.findByContext('quote', quoteId);
      if (chat) {
        chatId = chat.chatId;
      }
    }

    // Add user information and chat info for admin response
    const adminQuoteResponse: AdminQuoteResponse = {
      ...quoteResponse,
      chatAvailable,
      chatId,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    };

    logger.info(`Admin retrieved quote details: ${quoteId}`);
    return adminQuoteResponse;
  }
}

