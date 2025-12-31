import { inject, injectable } from 'tsyringe';
import { ICreatePaymentIntentUseCase } from '../../interface/quote/create_payment_intent_use_case.interface';
import { CreatePaymentIntentResponse } from '../../../dtos/payment.dto';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IPaymentRepository } from '../../../../domain/repositories/payment_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { QuoteStatus, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { Payment } from '../../../../domain/entities/payment.entity';
import { PaymentStatus, PaymentMethod } from '../../../../domain/entities/payment.entity';
import { getStripeInstance } from '../../../../infrastructure/service/stripe.service';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

/**
 * Use case for creating a payment intent
 * Validates quote, creates Stripe Payment Intent, and saves payment record
 */
@injectable()
export class CreatePaymentIntentUseCase implements ICreatePaymentIntentUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IPaymentRepository)
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(quoteId: string, userId: string): Promise<CreatePaymentIntentResponse> {
    try {
      // Input validation
      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
      }

      logger.info(`Creating payment intent for quote: ${quoteId} by user: ${userId}`);

      // Get quote and verify ownership
      const quote = await this.quoteRepository.findById(quoteId);

      if (!quote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      if (quote.userId !== userId) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Verify quote is in QUOTED status (exclude EXPIRED and other states)
      if (quote.status !== QuoteStatus.QUOTED) {
        // Explicitly block EXPIRED quotes with a clear error message
        if (quote.status === QuoteStatus.EXPIRED) {
          throw new AppError(
            'This quote has expired. Please submit a new quote.',
            'QUOTE_EXPIRED',
            400
          );
        }
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

      // Verify quote has pricing
      if (!quote.pricing || !quote.pricing.total || quote.pricing.total <= 0) {
        throw new AppError(
          'Quote does not have valid pricing',
          'INVALID_QUOTE_PRICING',
          400
        );
      }

      // Check if payment already exists and is pending
      const existingPayments = await this.paymentRepository.findByQuoteId(quoteId);
      const pendingPayment = existingPayments.find((p) => p.isPending());

      if (pendingPayment && pendingPayment.paymentIntentId) {
        // Retrieve PaymentIntent from Stripe to check its status
        const stripe = getStripeInstance();
        let paymentIntent: Stripe.PaymentIntent | null = null;
        let isTerminal = false;

        try {
          paymentIntent = await stripe.paymentIntents.retrieve(pendingPayment.paymentIntentId);
          isTerminal = this.isPaymentIntentTerminal(paymentIntent.status);
        } catch (error) {
          // If retrieve fails (network error, invalid ID, etc.), treat as terminal
          logger.warn(
            `Failed to retrieve PaymentIntent ${pendingPayment.paymentIntentId} from Stripe: ${error instanceof Error ? error.message : 'Unknown error'}. Treating as terminal and creating new PaymentIntent.`
          );
          isTerminal = true;
        }

        if (isTerminal) {
          // Mark the existing payment as FAILED
          logger.warn(
            `PaymentIntent ${pendingPayment.paymentIntentId} is terminal or unreachable, but DB payment is PENDING. Marking payment as FAILED and creating new PaymentIntent.`
          );
          await this.paymentRepository.updateById(pendingPayment.paymentId, {
            status: PaymentStatus.FAILED,
          } as Partial<Payment>);
          // Continue to create a new PaymentIntent below (do not reuse any properties from failed payment)
        } else if (paymentIntent) {
          // PaymentIntent is still usable, return it immediately
          logger.info(`Returning existing payment intent: ${pendingPayment.paymentIntentId}`);
          return {
            clientSecret: paymentIntent.client_secret as string,
            paymentIntentId: paymentIntent.id,
            paymentId: pendingPayment.paymentId,
          };
        }
      }

      // Create Stripe Payment Intent
      const stripe = getStripeInstance();
      const amountInCents = Math.round(quote.pricing.total * 100); // Convert to cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'inr',
        metadata: {
          quoteId,
          userId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Created Stripe payment intent: ${paymentIntent.id} for quote: ${quoteId}`);

      // Create Payment entity
      const paymentId = uuidv4();
      const payment = new Payment(
        paymentId,
        quoteId,
        userId,
        quote.pricing.total,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.PENDING,
        new Date(),
        new Date(),
        paymentIntent.id,
        undefined,
        undefined,
        { stripePaymentIntentId: paymentIntent.id }
      );

      // Save payment to database
      await this.paymentRepository.create(payment);

      logger.info(`Created payment record: ${paymentId} for quote: ${quoteId}`);

      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentIntentId: paymentIntent.id,
        paymentId,
      };
    } catch (error) {
      logger.error(
        `Error creating payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Checks if a Stripe PaymentIntent status is terminal (cannot be reused)
   * Terminal states: succeeded, canceled
   * Note: When payment fails, Stripe typically sets status to 'canceled'
   */
  private isPaymentIntentTerminal(status: Stripe.PaymentIntent.Status): boolean {
    const terminalStates: Stripe.PaymentIntent.Status[] = [
      'succeeded',
      'canceled',
    ];
    return terminalStates.includes(status);
  }
}
