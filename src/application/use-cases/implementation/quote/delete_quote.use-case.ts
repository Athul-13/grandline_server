import { injectable, inject } from 'tsyringe';
import { IDeleteQuoteUseCase } from '../../interface/quote/delete_quote_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

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
    // Input validation
    if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    const quote = await this.quoteRepository.findById(quoteId);

    if (!quote) {
      logger.warn(`Attempt to delete non-existent quote: ${quoteId}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Verify ownership
    if (quote.userId !== userId) {
      logger.warn(`User ${userId} attempted to delete quote ${quoteId} owned by ${quote.userId}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Check if quote can be deleted
    if (!quote.canBeDeleted()) {
      logger.warn(`Attempt to delete quote ${quoteId} with status ${quote.status}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_CANNOT_BE_DELETED, ERROR_CODES.QUOTE_CANNOT_BE_DELETED, 400);
    }

    // Soft delete
    await this.quoteRepository.softDelete(quoteId);
  }
}

