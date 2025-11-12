import { injectable, inject } from 'tsyringe';
import { IUpdateQuoteDraftUseCase } from '../../interface/quote/update_quote_draft_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { UpdateQuoteDraftRequest, QuoteResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { QuoteMapper } from '../../../mapper/quote.mapper';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { Quote } from '../../../../domain/entities/quote.entity';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for updating a quote draft
 * Updates quote draft with new data (auto-save functionality)
 */
@injectable()
export class UpdateQuoteDraftUseCase implements IUpdateQuoteDraftUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository
  ) {}

  async execute(
    quoteId: string,
    request: UpdateQuoteDraftRequest,
    userId: string
  ): Promise<QuoteResponse> {
    // Input validation
    if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Get existing quote
    const existingQuote = await this.quoteRepository.findById(quoteId);

    if (!existingQuote) {
      logger.warn(`Attempt to update non-existent quote: ${quoteId}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Verify ownership
    if (existingQuote.userId !== userId) {
      logger.warn(`User ${userId} attempted to update quote ${quoteId} owned by ${existingQuote.userId}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Check if quote can be edited
    if (!existingQuote.canBeEdited()) {
      logger.warn(`Attempt to update quote ${quoteId} with status ${existingQuote.status}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_ALREADY_SUBMITTED, ERROR_CODES.QUOTE_ALREADY_SUBMITTED, 400);
    }

    // Build update object (plain object for MongoDB update)
    const update: Record<string, unknown> = {};

    if (request.tripType !== undefined) {
      update.tripType = request.tripType;
    }

    if (request.currentStep !== undefined) {
      update.currentStep = request.currentStep;
    }

    if (request.tripName !== undefined) {
      update.tripName = request.tripName;
    }

    if (request.eventType !== undefined) {
      update.eventType = request.eventType;
    }

    if (request.customEventType !== undefined) {
      update.customEventType = request.customEventType;
    }

    if (request.passengers !== undefined) {
      update.passengerCount = request.passengers.length;
    }

    if (request.selectedVehicles !== undefined) {
      update.selectedVehicles = request.selectedVehicles;
    }

    if (request.selectedAmenities !== undefined) {
      update.selectedAmenities = request.selectedAmenities;
    }

    // Update quote (cast to Partial<Quote> for type compatibility)
    await this.quoteRepository.updateById(quoteId, update as Partial<Quote>);

    // Fetch updated quote
    const updatedQuote = await this.quoteRepository.findById(quoteId);
    if (!updatedQuote) {
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    return QuoteMapper.toQuoteResponse(updatedQuote);
  }
}

