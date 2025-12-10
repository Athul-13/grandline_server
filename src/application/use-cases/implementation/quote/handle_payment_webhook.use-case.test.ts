import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { HandlePaymentWebhookUseCase } from './handle_payment_webhook.use-case';
import { MockQuoteRepository } from '../../../../shared/test/mocks/repositories/quote_repository.mock';
import { MockPaymentRepository } from '../../../../shared/test/mocks/repositories/payment_repository.mock';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { clearContainer } from '../../../../shared/test/helpers/test_setup';
import { createPendingPaymentFixture } from '../../../../shared/test/fixtures/payment.fixture';
import { QuoteStatus } from '../../../../shared/constants';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';
import { createQuotedQuoteFixture } from '../../../../shared/test/fixtures/quote.fixture';
import Stripe from 'stripe';

// Mock logger to avoid console output in tests
vi.mock('../../../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('HandlePaymentWebhookUseCase', () => {
  let useCase: HandlePaymentWebhookUseCase;
  let mockQuoteRepository: MockQuoteRepository;
  let mockPaymentRepository: MockPaymentRepository;

  beforeEach(() => {
    clearContainer();

    // Create mock repositories
    mockQuoteRepository = new MockQuoteRepository();
    mockPaymentRepository = new MockPaymentRepository();

    // Register mocks in container
    container.registerInstance(REPOSITORY_TOKENS.IQuoteRepository, mockQuoteRepository);
    container.registerInstance(REPOSITORY_TOKENS.IPaymentRepository, mockPaymentRepository);

    // Create use case instance
    useCase = container.resolve(HandlePaymentWebhookUseCase);
  });

  describe('execute', () => {
    it('should handle payment_intent.succeeded event and update payment and quote status', async () => {
      // Arrange
      const paymentIntentId = 'pi_test_123';
      const quoteId = 'quote-123';
      const userId = 'user-123';
      const transactionId = 'ch_test_123';

      const payment = createPendingPaymentFixture({
        paymentId: 'payment-123',
        quoteId,
        userId,
        paymentIntentId,
      });

      const quote = createQuotedQuoteFixture({
        quoteId,
        userId,
      });

      const paymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        status: 'succeeded',
        latest_charge: transactionId,
      };

      mockPaymentRepository.findByPaymentIntentId.mockResolvedValue(payment);
      mockQuoteRepository.findById.mockResolvedValue(quote);

      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: paymentIntent,
        },
      };

      // Act
      await useCase.execute(event);

      // Assert
      expect(mockPaymentRepository.findByPaymentIntentId).toHaveBeenCalledWith(paymentIntentId);
      expect(mockPaymentRepository.updateById).toHaveBeenCalledWith(
        payment.paymentId,
        expect.objectContaining({
          status: PaymentStatus.SUCCEEDED,
          transactionId,
          paidAt: expect.any(Date),
        })
      );
      expect(mockQuoteRepository.updateById).toHaveBeenCalledWith(quoteId, {
        status: QuoteStatus.PAID,
      });
    });

    it('should handle payment_intent.payment_failed event and update payment status', async () => {
      // Arrange
      const paymentIntentId = 'pi_test_123';
      const quoteId = 'quote-123';
      const userId = 'user-123';

      const payment = createPendingPaymentFixture({
        paymentId: 'payment-123',
        quoteId,
        userId,
        paymentIntentId,
      });

      const paymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        status: 'payment_failed' as Stripe.PaymentIntent.Status,
      };

      mockPaymentRepository.findByPaymentIntentId.mockResolvedValue(payment);

      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: paymentIntent,
        },
      };

      // Act
      await useCase.execute(event);

      // Assert
      expect(mockPaymentRepository.findByPaymentIntentId).toHaveBeenCalledWith(paymentIntentId);
      expect(mockPaymentRepository.updateById).toHaveBeenCalledWith(
        payment.paymentId,
        expect.objectContaining({
          status: PaymentStatus.FAILED,
        })
      );
      expect(mockQuoteRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle payment_intent.canceled event and update payment status to failed', async () => {
      // Arrange
      const paymentIntentId = 'pi_test_123';
      const quoteId = 'quote-123';
      const userId = 'user-123';

      const payment = createPendingPaymentFixture({
        paymentId: 'payment-123',
        quoteId,
        userId,
        paymentIntentId,
      });

      const paymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        status: 'canceled',
      };

      mockPaymentRepository.findByPaymentIntentId.mockResolvedValue(payment);

      const event = {
        type: 'payment_intent.canceled',
        data: {
          object: paymentIntent,
        },
      };

      // Act
      await useCase.execute(event);

      // Assert
      expect(mockPaymentRepository.findByPaymentIntentId).toHaveBeenCalledWith(paymentIntentId);
      expect(mockPaymentRepository.updateById).toHaveBeenCalledWith(
        payment.paymentId,
        expect.objectContaining({
          status: PaymentStatus.FAILED,
        })
      );
      expect(mockQuoteRepository.updateById).not.toHaveBeenCalled();
    });

    it('should return early if payment is not found for payment intent', async () => {
      // Arrange
      const paymentIntentId = 'pi_test_123';

      const paymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        status: 'succeeded',
      };

      mockPaymentRepository.findByPaymentIntentId.mockResolvedValue(null);

      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: paymentIntent,
        },
      };

      // Act
      await useCase.execute(event);

      // Assert
      expect(mockPaymentRepository.findByPaymentIntentId).toHaveBeenCalledWith(paymentIntentId);
      expect(mockPaymentRepository.updateById).not.toHaveBeenCalled();
      expect(mockQuoteRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle unhandled event types gracefully', async () => {
      // Arrange
      const paymentIntentId = 'pi_test_123';
      const quoteId = 'quote-123';
      const userId = 'user-123';

      const payment = createPendingPaymentFixture({
        paymentId: 'payment-123',
        quoteId,
        userId,
        paymentIntentId,
      });

      const paymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        status: 'processing',
      };

      mockPaymentRepository.findByPaymentIntentId.mockResolvedValue(payment);

      const event = {
        type: 'payment_intent.processing',
        data: {
          object: paymentIntent,
        },
      };

      // Act
      await useCase.execute(event);

      // Assert
      expect(mockPaymentRepository.findByPaymentIntentId).toHaveBeenCalledWith(paymentIntentId);
      expect(mockPaymentRepository.updateById).not.toHaveBeenCalled();
      expect(mockQuoteRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error if repository operations fail', async () => {
      // Arrange
      const paymentIntentId = 'pi_test_123';
      const quoteId = 'quote-123';
      const userId = 'user-123';

      const payment = createPendingPaymentFixture({
        paymentId: 'payment-123',
        quoteId,
        userId,
        paymentIntentId,
      });

      const paymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        status: 'succeeded',
        latest_charge: 'ch_test_123',
      };

      mockPaymentRepository.findByPaymentIntentId.mockResolvedValue(payment);
      mockPaymentRepository.updateById.mockRejectedValue(new Error('Database error'));

      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: paymentIntent,
        },
      };

      // Act & Assert
      await expect(useCase.execute(event)).rejects.toThrow('Database error');
    });

    it('should handle payment_intent.succeeded with null latest_charge', async () => {
      // Arrange
      const paymentIntentId = 'pi_test_123';
      const quoteId = 'quote-123';
      const userId = 'user-123';

      const payment = createPendingPaymentFixture({
        paymentId: 'payment-123',
        quoteId,
        userId,
        paymentIntentId,
      });

      const quote = createQuotedQuoteFixture({
        quoteId,
        userId,
      });

      const paymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        status: 'succeeded',
        latest_charge: null,
      };

      mockPaymentRepository.findByPaymentIntentId.mockResolvedValue(payment);
      mockQuoteRepository.findById.mockResolvedValue(quote);

      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: paymentIntent,
        },
      };

      // Act
      await useCase.execute(event);

      // Assert
      expect(mockPaymentRepository.updateById).toHaveBeenCalledWith(
        payment.paymentId,
        expect.objectContaining({
          status: PaymentStatus.SUCCEEDED,
          transactionId: null,
          paidAt: expect.any(Date),
        })
      );
      expect(mockQuoteRepository.updateById).toHaveBeenCalledWith(quoteId, {
        status: QuoteStatus.PAID,
      });
    });
  });
});
