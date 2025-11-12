import { inject, injectable } from 'tsyringe';
import { ISubmitQuoteUseCase } from '../../interface/quote/submit_quote_use_case.interface';
import { SubmitQuoteResponse } from '../../../dtos/quote.dto';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { ICalculateQuotePricingUseCase } from '../../interface/quote/calculate_quote_pricing_use_case.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../../infrastructure/di/tokens';
import { QuoteStatus, ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { Quote } from '../../../../domain/entities/quote.entity';

/**
 * Use case for submitting a quote
 * Changes quote status from draft to submitted and calculates final pricing
 */
@injectable()
export class SubmitQuoteUseCase implements ISubmitQuoteUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(USE_CASE_TOKENS.CalculateQuotePricingUseCase)
    private readonly calculateQuotePricingUseCase: ICalculateQuotePricingUseCase
  ) {}

  async execute(quoteId: string, userId: string): Promise<SubmitQuoteResponse> {
    try {
      logger.info(`Submitting quote: ${quoteId} by user: ${userId}`);

      // Get quote and verify ownership
      const quote = await this.quoteRepository.findById(quoteId);

      if (!quote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      if (quote.userId !== userId) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Verify quote is a draft
      if (quote.status !== QuoteStatus.DRAFT) {
        throw new AppError(
          ERROR_MESSAGES.QUOTE_ALREADY_SUBMITTED,
          ERROR_CODES.QUOTE_INVALID_STATUS,
          400
        );
      }

      // Verify quote is complete (all 5 steps done)
      if (quote.currentStep !== 5) {
        throw new AppError('Quote is not complete. Please complete all steps before submitting.', 'QUOTE_INCOMPLETE', 400);
      }

      // Calculate pricing
      const pricing = await this.calculateQuotePricingUseCase.execute(quoteId, userId);

      // Update quote with pricing and change status to submitted
      const updatedQuote = await this.quoteRepository.updateById(quoteId, {
        status: QuoteStatus.SUBMITTED,
        pricing: {
          fuelPriceAtTime: pricing.fuelPriceAtTime,
          averageDriverRateAtTime: pricing.averageDriverRateAtTime,
          taxPercentageAtTime: pricing.taxPercentageAtTime,
          baseFare: pricing.baseFare,
          distanceFare: pricing.distanceFare,
          driverCharge: pricing.driverCharge,
          fuelMaintenance: pricing.fuelMaintenance,
          nightCharge: pricing.nightCharge,
          stayingCharge: pricing.stayingCharge,
          amenitiesTotal: pricing.amenitiesTotal,
          subtotal: pricing.subtotal,
          tax: pricing.tax,
          total: pricing.total,
        },
      } as Partial<Quote>);

      logger.info(`Quote submitted successfully: ${quoteId}`);

      return {
        quoteId: updatedQuote.quoteId,
        status: QuoteStatus.SUBMITTED,
        pricing,
      };
    } catch (error) {
      logger.error(
        `Error submitting quote ${quoteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to submit quote', 'QUOTE_SUBMISSION_ERROR', 500);
    }
  }
}

