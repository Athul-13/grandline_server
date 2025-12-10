import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { HTTP_STATUS, ERROR_MESSAGES, ERROR_CODES } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';
import { AppError } from '../../../shared/utils/app_error.util';
import { IQuoteRepository } from '../../../domain/repositories/quote_repository.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../application/di/tokens';
import { ICreatePaymentIntentUseCase } from '../../../application/use-cases/interface/quote/create_payment_intent_use_case.interface';
import { IHandlePaymentWebhookUseCase } from '../../../application/use-cases/interface/quote/handle_payment_webhook_use_case.interface';
import { STRIPE_CONFIG } from '../../../shared/config';
import Stripe from 'stripe';
import { getStripeInstance } from '../../../infrastructure/services/stripe.service';
import { QuoteStatus } from '../../../shared/constants';
/**
 * Payment controller
 * Handles payment-related operations for quotes
 */
@injectable()
export class PaymentController {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(USE_CASE_TOKENS.CreatePaymentIntentUseCase as never)
    private readonly createPaymentIntentUseCase: ICreatePaymentIntentUseCase,
    @inject(USE_CASE_TOKENS.HandlePaymentWebhookUseCase as never)
    private readonly handlePaymentWebhookUseCase: IHandlePaymentWebhookUseCase
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

      // Return payment page data
      const response = {
        quoteId: quote.quoteId,
        totalPrice: quote.pricing?.total ?? 0,
        pricing: quote.pricing,
        paymentWindowExpiresAt: quote.quotedAt
          ? new Date(quote.quotedAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
          : null,
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

  /**
   * Handles creating a payment intent for a quote
   * POST /api/v1/quotes/:id/payment/create-intent
   */
  async createPaymentIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: quoteId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      logger.info(`Creating payment intent for quote: ${quoteId} by user: ${userId}`);

      const result = await this.createPaymentIntentUseCase.execute(quoteId, userId);

      logger.info(`Payment intent created successfully: ${result.paymentIntentId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, result);
    } catch (error) {
      logger.error(
        `Error creating payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles Stripe webhook events
   * POST /api/v1/webhooks/stripe
   * Note: This endpoint does NOT use authentication middleware
   */
  async handleWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      logger.error('Missing stripe-signature header');
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
      logger.error('Stripe webhook secret not configured');
      res.status(500).send('Webhook secret not configured');
      return;
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripeInstance();
      // req.body is the raw body buffer (needs to be set up in middleware)
      event = stripe.webhooks.constructEvent(
        req.body as string | Buffer,
        sig as string,
        STRIPE_CONFIG.WEBHOOK_SECRET
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Webhook signature verification failed: ${errorMessage}`);
      res.status(400).send(`Webhook Error: ${errorMessage}`);
      return;
    }

    try {
      logger.info(`Received webhook event: ${event.type}`);

      await this.handlePaymentWebhookUseCase.execute({
        type: event.type,
        data: event.data,
      });

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error(
        `Error handling webhook: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
}
