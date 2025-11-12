import { injectable, inject } from 'tsyringe';
import { ICreateQuoteDraftUseCase } from '../../interface/quote/create_quote_draft_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { CreateQuoteDraftRequest, CreateQuoteDraftResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { Quote } from '../../../../domain/entities/quote.entity';
import { QuoteStatus, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for creating a quote draft
 * Creates a new quote draft when user starts building a quote
 */
@injectable()
export class CreateQuoteDraftUseCase implements ICreateQuoteDraftUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository
  ) {}

  async execute(request: CreateQuoteDraftRequest, userId: string): Promise<CreateQuoteDraftResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    if (!request || !request.tripType) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    const quoteId = randomUUID();
    const now = new Date();

    const quote = new Quote(
      quoteId,
      userId,
      request.tripType,
      QuoteStatus.DRAFT,
      now,
      now,
      undefined, // tripName
      undefined, // eventType
      undefined, // customEventType
      undefined, // passengerCount
      1, // currentStep - starts at step 1
      undefined, // selectedVehicles
      undefined, // selectedAmenities
      undefined, // pricing
      undefined, // routeData
      false // isDeleted
    );

    await this.quoteRepository.create(quote);

    return {
      quoteId,
      status: QuoteStatus.DRAFT,
      currentStep: 1,
    };
  }
}

