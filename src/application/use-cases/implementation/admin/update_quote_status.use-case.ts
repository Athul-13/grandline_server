import { injectable, inject } from 'tsyringe';
import { IUpdateQuoteStatusUseCase } from '../../interface/admin/update_quote_status_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IQuoteItineraryRepository } from '../../../../domain/repositories/quote_itinerary_repository.interface';
import { IPassengerRepository } from '../../../../domain/repositories/passenger_repository.interface';
import { UpdateQuoteStatusRequest, QuoteResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { QuoteMapper } from '../../../mapper/quote.mapper';
import { QuoteStatus, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { Quote } from '../../../../domain/entities/quote.entity';

/**
 * Use case for updating quote status
 * Admin can change status to PAID or back to SUBMITTED
 */
@injectable()
export class UpdateQuoteStatusUseCase implements IUpdateQuoteStatusUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository
  ) {}

  async execute(quoteId: string, request: UpdateQuoteStatusRequest): Promise<QuoteResponse> {
    // Input validation
    if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
    }

    // Fetch quote
    const quote = await this.quoteRepository.findById(quoteId);

    if (!quote) {
      logger.warn(`Admin attempted to update status of non-existent quote: ${quoteId}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Validate status transition
    const newStatus = request.status;
    const currentStatus = quote.status;

    // Can change to PAID from any status
    // Can change from PAID back to SUBMITTED
    if (newStatus === QuoteStatus.PAID) {
      // Allow changing to PAID from any status
      if (currentStatus === QuoteStatus.PAID) {
        logger.warn(`Quote ${quoteId} is already PAID`);
        throw new AppError(
          'Quote is already marked as paid',
          'QUOTE_ALREADY_PAID',
          400
        );
      }
    } else if (newStatus === QuoteStatus.SUBMITTED) {
      // Can only change to SUBMITTED if currently PAID
      if (currentStatus !== QuoteStatus.PAID) {
        logger.warn(
          `Invalid status transition: ${currentStatus} -> ${newStatus} for quote ${quoteId}`
        );
        throw new AppError(
          'Can only change status to SUBMITTED from PAID status',
          'INVALID_STATUS_TRANSITION',
          400
        );
      }
    }

    // Update quote status
    const update: Partial<Quote> = {
      status: newStatus,
    };
    await this.quoteRepository.updateById(quoteId, update);

    // Fetch updated quote
    const updatedQuote = await this.quoteRepository.findById(quoteId);
    if (!updatedQuote) {
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Fetch itinerary and passengers
    const itineraryStops = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
    const passengers = await this.passengerRepository.findByQuoteId(quoteId);

    logger.info(
      `Admin updated quote status: ${quoteId}, ${currentStatus} -> ${newStatus}`
    );

    return QuoteMapper.toQuoteResponse(updatedQuote, itineraryStops, passengers);
  }
}

