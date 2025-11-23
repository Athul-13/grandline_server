import { inject, injectable } from 'tsyringe';
import { ISubmitQuoteUseCase } from '../../interface/quote/submit_quote_use_case.interface';
import { SubmitQuoteResponse } from '../../../dtos/quote.dto';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ICalculateQuotePricingUseCase } from '../../interface/quote/calculate_quote_pricing_use_case.interface';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { QuoteStatus, ERROR_MESSAGES, ERROR_CODES, TripType } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { Quote } from '../../../../domain/entities/quote.entity';
import { EmailType, QuoteEmailData } from '../../../../shared/types/email.types';

/**
 * Use case for submitting a quote
 * Changes quote status from draft to submitted and calculates final pricing
 */
@injectable()
export class SubmitQuoteUseCase implements ISubmitQuoteUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(USE_CASE_TOKENS.CalculateQuotePricingUseCase)
    private readonly calculateQuotePricingUseCase: ICalculateQuotePricingUseCase,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService
  ) {}

  async execute(quoteId: string, userId: string): Promise<SubmitQuoteResponse> {
    try {
      // Input validation
      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
      }

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
      await this.quoteRepository.updateById(quoteId, {
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
          amenitiesTotal: pricing.amenitiesTotal,
          subtotal: pricing.subtotal,
          tax: pricing.tax,
          total: pricing.total,
        },
      } as Partial<Quote>);

      // Fetch updated quote
      const updatedQuote = await this.quoteRepository.findById(quoteId);
      if (!updatedQuote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      logger.info(`Quote submitted successfully: ${quoteId}`);

      // Send confirmation email (don't fail if email fails)
      try {
        const user = await this.userRepository.findById(userId);
        if (user && user.email) {
          const emailData: QuoteEmailData = {
            email: user.email,
            fullName: user.fullName,
            quoteId: updatedQuote.quoteId,
            tripName: updatedQuote.tripName,
            tripType: updatedQuote.tripType === TripType.ONE_WAY ? 'one_way' : 'two_way',
            totalPrice: pricing.total,
            quoteDate: updatedQuote.updatedAt,
            // TODO: Add frontend URL to view quote link
            // viewQuoteLink: `${process.env.FRONTEND_URL}/quotes/${updatedQuote.quoteId}`,
          };

          await this.emailService.sendEmail(EmailType.QUOTE, emailData);
          logger.info(`Quote confirmation email sent to ${user.email} for quote: ${quoteId}`);
        }
      } catch (emailError) {
        // Log email error but don't fail the quote submission
        logger.error(
          `Failed to send quote confirmation email for quote ${quoteId}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
        );
      }

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

