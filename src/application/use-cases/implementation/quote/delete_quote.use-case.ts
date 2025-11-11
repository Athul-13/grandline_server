import { injectable, inject } from 'tsyringe';
import { IDeleteQuoteUseCase } from '../../interface/quote/delete_quote_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';

/**
 * Use case for deleting a quote
 * Soft deletes a quote draft
 */
@injectable()
export class DeleteQuoteUseCase implements IDeleteQuoteUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository
  ) {}

  async execute(quoteId: string, userId: string): Promise<void> {
    const quote = await this.quoteRepository.findById(quoteId);

    if (!quote) {
      logger.warn(`Attempt to delete non-existent quote: ${quoteId}`);
      throw new Error(ERROR_MESSAGES.QUOTE_NOT_FOUND);
    }

    // Verify ownership
    if (quote.userId !== userId) {
      logger.warn(`User ${userId} attempted to delete quote ${quoteId} owned by ${quote.userId}`);
      throw new Error(ERROR_MESSAGES.FORBIDDEN);
    }

    // Check if quote can be deleted
    if (!quote.canBeDeleted()) {
      logger.warn(`Attempt to delete quote ${quoteId} with status ${quote.status}`);
      throw new Error(ERROR_MESSAGES.QUOTE_CANNOT_BE_DELETED);
    }

    // Soft delete
    await this.quoteRepository.softDelete(quoteId);
  }
}

