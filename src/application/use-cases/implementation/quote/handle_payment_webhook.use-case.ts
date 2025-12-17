import { inject, injectable } from 'tsyringe';
import { IHandlePaymentWebhookUseCase } from '../../interface/quote/handle_payment_webhook_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IPaymentRepository } from '../../../../domain/repositories/payment_repository.interface';
import { IReservationChargeRepository } from '../../../../domain/repositories/reservation_charge_repository.interface';
import { ICreateReservationUseCase } from '../../interface/reservation/create_reservation_use_case.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { QuoteStatus } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';
import Stripe from 'stripe';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

/**
 * Use case for handling payment webhooks
 * Processes Stripe webhook events and updates payment and quote status
 */
@injectable()
export class HandlePaymentWebhookUseCase implements IHandlePaymentWebhookUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IPaymentRepository as never)
    private readonly paymentRepository: IPaymentRepository,
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository,
    @inject(USE_CASE_TOKENS.CreateReservationUseCase)
    private readonly createReservationUseCase: ICreateReservationUseCase
  ) {}

  async execute(event: { type: string; data: { object: unknown } }): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    logger.info(`Processing webhook event: ${event.type} for payment intent: ${paymentIntent.id}`);

    try {
      // Find payment by payment intent ID
      const payment = await this.paymentRepository.findByPaymentIntentId(paymentIntent.id);

      if (!payment) {
        logger.warn(`Payment not found for payment intent: ${paymentIntent.id}`);
        return;
      }

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(payment, paymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(payment, paymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(payment, paymentIntent);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error(
        `Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async handlePaymentSucceeded(
    payment: import('../../../../domain/entities/payment.entity').Payment,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.info(`Payment succeeded for payment intent: ${paymentIntent.id}`);

    // Update payment status
    await this.paymentRepository.updateById(payment.paymentId, {
      status: PaymentStatus.SUCCEEDED,
      transactionId: paymentIntent.latest_charge as string | undefined,
      paidAt: new Date(),
    } as Partial<import('../../../../domain/entities/payment.entity').Payment>);

    // Check if this is a charge payment (via metadata)
    const paymentType = payment.metadata?.paymentType as string | undefined;
    const chargeId = payment.metadata?.chargeId as string | undefined;

    if (paymentType === 'charge' && chargeId) {
      // Mark charge as paid
      try {
        await this.chargeRepository.updateById(chargeId, {
          isPaid: true,
          paidAt: new Date(),
        });
        logger.info(`Charge ${chargeId} marked as paid via payment ${payment.paymentId}`);
      } catch (chargeError) {
        logger.error(
          `Failed to mark charge ${chargeId} as paid: ${chargeError instanceof Error ? chargeError.message : 'Unknown error'}`
        );
        // Don't fail payment processing if charge update fails
      }
    } else {
      // This is a quote payment - handle quote flow
      // Get quote before update to track old status
      const quote = await this.quoteRepository.findById(payment.quoteId);
      const oldStatus = quote?.status;

      // Update quote status to PAID
      await this.quoteRepository.updateById(payment.quoteId, {
        status: QuoteStatus.PAID,
      } as Partial<import('../../../../domain/entities/quote.entity').Quote>);

      // Fetch updated quote for socket emission
      const updatedQuote = await this.quoteRepository.findById(payment.quoteId);
      if (updatedQuote && oldStatus) {
        // Emit socket event for admin dashboard
        try {
          const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
          socketEventService.emitQuoteStatusChanged(updatedQuote, oldStatus);
        } catch (error) {
          // Don't fail payment processing if socket emission fails
          logger.error('Error emitting quote status changed event:', error);
        }
      }

      // Create reservation from quote
      try {
        await this.createReservationUseCase.execute(payment.quoteId, payment.paymentId);
        logger.info(`Reservation created for quote ${payment.quoteId}`);
      } catch (reservationError) {
        logger.error(
          `Failed to create reservation for quote ${payment.quoteId}: ${reservationError instanceof Error ? reservationError.message : 'Unknown error'}`
        );
        // Don't fail payment processing if reservation creation fails
        // Payment and quote status are already updated
      }

      logger.info(
        `Updated payment ${payment.paymentId} and quote ${payment.quoteId} to PAID status`
      );
    }
  }

  private async handlePaymentFailed(
    payment: import('../../../../domain/entities/payment.entity').Payment,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.warn(`Payment failed for payment intent: ${paymentIntent.id}`);

    // Update payment status
    await this.paymentRepository.updateById(payment.paymentId, {
      status: PaymentStatus.FAILED,
    } as Partial<import('../../../../domain/entities/payment.entity').Payment>);

    logger.info(`Updated payment ${payment.paymentId} to FAILED status`);
  }

  private async handlePaymentCanceled(
    payment: import('../../../../domain/entities/payment.entity').Payment,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.info(`Payment canceled for payment intent: ${paymentIntent.id}`);

    // Update payment status to failed (canceled is treated as failed)
    await this.paymentRepository.updateById(payment.paymentId, {
      status: PaymentStatus.FAILED,
    } as Partial<import('../../../../domain/entities/payment.entity').Payment>);

    logger.info(`Updated payment ${payment.paymentId} to FAILED status (canceled)`);
  }
}
