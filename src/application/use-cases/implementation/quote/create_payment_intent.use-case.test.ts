import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { CreatePaymentIntentUseCase } from './create_payment_intent.use-case';
import { MockQuoteRepository } from '../../../../shared/test/mocks/repositories/quote_repository.mock';
import { MockPaymentRepository } from '../../../../shared/test/mocks/repositories/payment_repository.mock';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { clearContainer } from '../../../../shared/test/helpers/test_setup';
import { createQuotedQuoteFixture, createQuoteWithPricingFixture, createQuoteFixture } from '../../../../shared/test/fixtures/quote.fixture';
import { createPendingPaymentFixture } from '../../../../shared/test/fixtures/payment.fixture';
import { QuoteStatus } from '../../../../shared/constants';
import * as stripeService from '../../../../infrastructure/service/stripe.service';

// Mock the Stripe service
vi.mock('../../../../infrastructure/services/stripe.service', () => ({
  getStripeInstance: vi.fn(),
}));

// Mock logger to avoid console output in tests
vi.mock('../../../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('CreatePaymentIntentUseCase', () => {
  let useCase: CreatePaymentIntentUseCase;
  let mockQuoteRepository: MockQuoteRepository;
  let mockPaymentRepository: MockPaymentRepository;
  let mockStripe: {
    paymentIntents: {
      create: ReturnType<typeof vi.fn>;
      retrieve: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    clearContainer();

    // Create mock repositories
    mockQuoteRepository = new MockQuoteRepository();
    mockPaymentRepository = new MockPaymentRepository();

    // Register mocks in container
    container.registerInstance(REPOSITORY_TOKENS.IQuoteRepository, mockQuoteRepository);
    container.registerInstance(REPOSITORY_TOKENS.IPaymentRepository, mockPaymentRepository);

    // Create mock Stripe instance
    mockStripe = {
      paymentIntents: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
    };

    vi.mocked(stripeService.getStripeInstance).mockReturnValue(mockStripe as any);

    // Create use case instance
    useCase = container.resolve(CreatePaymentIntentUseCase);
  });

  describe('execute', () => {
    it('should create a new payment intent for a valid quote', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = 'user-123';
      const quote = createQuotedQuoteFixture({
        quoteId,
        userId,
        pricing: { total: 10000 },
      });

      const paymentIntentId = 'pi_test_123';
      const clientSecret = 'pi_test_123_secret';

      mockQuoteRepository.findById.mockResolvedValue(quote);
      mockPaymentRepository.findByQuoteId.mockResolvedValue([]);
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: paymentIntentId,
        client_secret: clientSecret,
      } as any);

      // Act
      const result = await useCase.execute(quoteId, userId);

      // Assert
      expect(result).toEqual({
        clientSecret,
        paymentIntentId,
        paymentId: expect.any(String),
      });
      expect(mockQuoteRepository.findById).toHaveBeenCalledWith(quoteId);
      expect(mockPaymentRepository.findByQuoteId).toHaveBeenCalledWith(quoteId);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000000, // 10000 * 100 (converted to cents)
        currency: 'inr',
        metadata: {
          quoteId,
          userId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      expect(mockPaymentRepository.create).toHaveBeenCalled();
    });

    it('should return existing payment intent if one already exists', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = 'user-123';
      const quote = createQuotedQuoteFixture({
        quoteId,
        userId,
        pricing: { total: 10000 },
      });

      const existingPaymentIntentId = 'pi_existing_123';
      const existingPayment = createPendingPaymentFixture({
        quoteId,
        userId,
        paymentIntentId: existingPaymentIntentId,
      });

      const clientSecret = 'pi_existing_123_secret';

      mockQuoteRepository.findById.mockResolvedValue(quote);
      mockPaymentRepository.findByQuoteId.mockResolvedValue([existingPayment]);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: existingPaymentIntentId,
        client_secret: clientSecret,
      } as any);

      // Act
      const result = await useCase.execute(quoteId, userId);

      // Assert
      expect(result).toEqual({
        clientSecret,
        paymentIntentId: existingPaymentIntentId,
        paymentId: existingPayment.paymentId,
      });
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(existingPaymentIntentId);
    });

    it('should throw error if quoteId is invalid', async () => {
      // Arrange
      const invalidQuoteId = '';
      const userId = 'user-123';

      // Act & Assert
      await expect(useCase.execute(invalidQuoteId, userId)).rejects.toThrow();
      expect(mockQuoteRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error if userId is invalid', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const invalidUserId = '';

      // Act & Assert
      await expect(useCase.execute(quoteId, invalidUserId)).rejects.toThrow();
      expect(mockQuoteRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error if quote is not found', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = 'user-123';

      mockQuoteRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(quoteId, userId)).rejects.toThrow();
      expect(mockQuoteRepository.findById).toHaveBeenCalledWith(quoteId);
    });

    it('should throw error if quote does not belong to user', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = 'user-123';
      const differentUserId = 'user-456';
      const quote = createQuotedQuoteFixture({
        quoteId,
        userId: differentUserId,
        pricing: { total: 10000 },
      });

      mockQuoteRepository.findById.mockResolvedValue(quote);

      // Act & Assert
      await expect(useCase.execute(quoteId, userId)).rejects.toThrow();
    });

    it('should throw error if quote payment window has expired', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = 'user-123';
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const quote = createQuoteFixture({
        quoteId,
        userId,
        pricing: { total: 10000 },
        quotedAt: expiredDate,
        status: QuoteStatus.QUOTED,
      });

      mockQuoteRepository.findById.mockResolvedValue(quote);

      // Act & Assert
      await expect(useCase.execute(quoteId, userId)).rejects.toThrow();
    });

    it('should throw error if quote does not have valid pricing', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = 'user-123';
      const quote = createQuotedQuoteFixture({
        quoteId,
        userId,
        pricing: undefined,
      });

      mockQuoteRepository.findById.mockResolvedValue(quote);

      // Act & Assert
      await expect(useCase.execute(quoteId, userId)).rejects.toThrow();
    });

    it('should throw error if quote has zero or negative pricing', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = 'user-123';
      const quote = createQuoteWithPricingFixture(0, {
        quoteId,
        userId,
      });

      mockQuoteRepository.findById.mockResolvedValue(quote);

      // Act & Assert
      await expect(useCase.execute(quoteId, userId)).rejects.toThrow();
    });
  });
});

