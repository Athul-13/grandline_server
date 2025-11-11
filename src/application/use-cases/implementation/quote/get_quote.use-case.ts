import { injectable, inject } from 'tsyringe';
import { IGetQuoteUseCase } from '../../interface/quote/get_quote_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { QuoteResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { QuoteMapper } from '../../../mapper/quote.mapper';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting a quote
 * Retrieves a single quote by ID
 */
@injectable()
export class GetQuoteUseCase implements IGetQuoteUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository
  ) {}

  async execute(quoteId: string, userId: string): Promise<QuoteResponse> {
    const quote = await this.quoteRepository.findById(quoteId);

    if (!quote) {
      logger.warn(`Attempt to get non-existent quote: ${quoteId}`);
      throw new Error(ERROR_MESSAGES.QUOTE_NOT_FOUND);
    }

    // Verify ownership
    if (quote.userId !== userId) {
      logger.warn(`User ${userId} attempted to get quote ${quoteId} owned by ${quote.userId}`);
      throw new Error(ERROR_MESSAGES.FORBIDDEN);
    }

    return QuoteMapper.toQuoteResponse(quote);
  }
}

