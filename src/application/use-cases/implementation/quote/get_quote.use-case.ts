import { injectable, inject } from 'tsyringe';
import { IGetQuoteUseCase } from '../../interface/quote/get_quote_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IQuoteItineraryRepository } from '../../../../domain/repositories/quote_itinerary_repository.interface';
import { IPassengerRepository } from '../../../../domain/repositories/passenger_repository.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { QuoteResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { QuoteMapper } from '../../../mapper/quote.mapper';
import { ERROR_MESSAGES, ERROR_CODES, QuoteStatus } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting a quote
 * Retrieves a single quote by ID
 */
@injectable()
export class GetQuoteUseCase implements IGetQuoteUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository,
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository
  ) {}

  async execute(quoteId: string, userId: string): Promise<QuoteResponse> {
    // Input validation
    if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    const quote = await this.quoteRepository.findById(quoteId);

    if (!quote) {
      logger.warn(`Attempt to get non-existent quote: ${quoteId}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Verify ownership
    if (quote.userId !== userId) {
      logger.warn(`User ${userId} attempted to get quote ${quoteId} owned by ${quote.userId}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Fetch itinerary and passengers
    const itineraryStops = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
    const passengers = await this.passengerRepository.findByQuoteId(quoteId);

    // Check chat availability (available when status is SUBMITTED or later)
    const chatAvailable = quote.status === QuoteStatus.SUBMITTED || 
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

    const response = QuoteMapper.toQuoteResponse(quote, itineraryStops, passengers);
    response.chatAvailable = chatAvailable;
    response.chatId = chatId;

    return response;
  }
}

