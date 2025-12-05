import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { HTTP_STATUS, QuoteStatus, ERROR_MESSAGES, ERROR_CODES } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';
import { AppError } from '../../../shared/utils/app_error.util';
import { IQuoteRepository } from '../../../domain/repositories/quote_repository.interface';
import { REPOSITORY_TOKENS } from '../../../application/di/tokens';

/**
 * Payment controller
 * Handles payment-related operations for quotes
 */
@injectable()
export class PaymentController {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository
  ) {}

  /**
   * Handles getting payment page data for a quote
   * This is a placeholder endpoint - payment integration will be added later
   */
  async getPaymentPage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: quoteId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      logger.info(`Payment page request for quote: ${quoteId} by user: ${userId}`);

      // Get quote and verify ownership
      const quote = await this.quoteRepository.findById(quoteId);

      if (!quote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      if (quote.userId !== userId) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Verify quote is in QUOTED status
      if (quote.status !== QuoteStatus.QUOTED) {
        throw new AppError(
          'Quote must be in QUOTED status to proceed with payment',
          'INVALID_QUOTE_STATUS',
          400
        );
      }

      // Check if payment window has expired
      if (quote.isPaymentWindowExpired()) {
        throw new AppError(
          ERROR_MESSAGES.QUOTE_PAYMENT_WINDOW_EXPIRED,
          'QUOTE_EXPIRED',
          400
        );
      }

      // Return payment page data (placeholder - payment integration will be added later)
      const response = {
        quoteId: quote.quoteId,
        totalPrice: quote.pricing?.total ?? 0,
        paymentWindowExpiresAt: quote.quotedAt
          ? new Date(quote.quotedAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
          : null,
        message: 'Payment integration will be implemented here',
      };

      logger.info(`Payment page data retrieved for quote: ${quoteId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error getting payment page: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}
