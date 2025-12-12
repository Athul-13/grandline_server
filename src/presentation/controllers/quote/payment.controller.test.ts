import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PaymentController } from './payment.controller';
import { MockQuoteRepository } from '../../../shared/test/mocks/repositories/quote_repository.mock';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../application/di/tokens';
import { clearContainer } from '../../../shared/test/helpers/test_setup';
import { createQuotedQuoteFixture, createQuoteFixture } from '../../../shared/test/fixtures/quote.fixture';
import { QuoteStatus } from '../../../shared/constants';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { Response } from 'express';
import { AppError } from '../../../shared/utils/app_error.util';
import * as stripeService from '../../../infrastructure/service/stripe.service';
import Stripe from 'stripe';

// Mock the Stripe service
vi.mock('../../../infrastructure/services/stripe.service', () => ({
  getStripeInstance: vi.fn(),
}));

// Mock logger to avoid console output in tests
vi.mock('../../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock response utility functions
vi.mock('../../../shared/utils/response.util', () => ({
  sendSuccessResponse: vi.fn(),
  sendErrorResponse: vi.fn(),
}));

// Mock config
vi.mock('../../../shared/config', () => ({
  STRIPE_CONFIG: {
    WEBHOOK_SECRET: 'whsec_test_secret',
  },
}));

// Import after mock to get the mocked version
import * as configModule from '../../../shared/config';

describe('PaymentController', () => {
  let controller: PaymentController;
  let mockQuoteRepository: MockQuoteRepository;
  let mockCreatePaymentIntentUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockHandlePaymentWebhookUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    clearContainer();

    // Create mock repositories
    mockQuoteRepository = new MockQuoteRepository();

    // Create mock use cases
    mockCreatePaymentIntentUseCase = {
      execute: vi.fn(),
    };

    mockHandlePaymentWebhookUseCase = {
      execute: vi.fn(),
    };

    // Register mocks in container
    container.registerInstance(REPOSITORY_TOKENS.IQuoteRepository, mockQuoteRepository);
    container.registerInstance(
      USE_CASE_TOKENS.CreatePaymentIntentUseCase as never,
      mockCreatePaymentIntentUseCase
    );
    container.registerInstance(
      USE_CASE_TOKENS.HandlePaymentWebhookUseCase as never,
      mockHandlePaymentWebhookUseCase
    );

    // Create controller instance
    controller = container.resolve(PaymentController);

    // Create mock request
    mockRequest = {
      params: {},
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
      },
      headers: {},
      body: {},
    };

    // Create mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('getPaymentPage', () => {
    it('should return payment page data for a valid quote', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = 'user-123';
      const quote = createQuotedQuoteFixture({
        quoteId,
        userId,
        pricing: { total: 10000 },
      });

      mockRequest.params = { id: quoteId };
      mockQuoteRepository.findById.mockResolvedValue(quote);

      // Act
      await controller.getPaymentPage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockQuoteRepository.findById).toHaveBeenCalledWith(quoteId);
      const { sendSuccessResponse } = await import('../../../shared/utils/response.util');
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse as Response,
        200,
        expect.objectContaining({
          quoteId,
          totalPrice: 10000,
          pricing: quote.pricing,
        })
      );
    });

    it('should throw error if user is not authenticated', async () => {
      // Arrange
      const quoteId = 'quote-123';
      mockRequest.params = { id: quoteId };
      mockRequest.user = undefined;

      // Act
      await controller.getPaymentPage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      const { sendErrorResponse } = await import('../../../shared/utils/response.util');
      expect(sendErrorResponse).toHaveBeenCalled();
    });

    it('should throw error if quoteId is invalid', async () => {
      // Arrange
      mockRequest.params = { id: '' };

      // Act
      await controller.getPaymentPage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      const { sendErrorResponse } = await import('../../../shared/utils/response.util');
      expect(sendErrorResponse).toHaveBeenCalled();
    });

    it('should throw error if quote is not found', async () => {
      // Arrange
      const quoteId = 'quote-123';
      mockRequest.params = { id: quoteId };
      mockQuoteRepository.findById.mockResolvedValue(null);

      // Act
      await controller.getPaymentPage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      const { sendErrorResponse } = await import('../../../shared/utils/response.util');
      expect(sendErrorResponse).toHaveBeenCalled();
    });

    it('should throw error if quote does not belong to user', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const differentUserId = 'user-456';
      const quote = createQuotedQuoteFixture({
        quoteId,
        userId: differentUserId,
      });

      mockRequest.params = { id: quoteId };
      mockQuoteRepository.findById.mockResolvedValue(quote);

      // Act
      await controller.getPaymentPage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      const { sendErrorResponse } = await import('../../../shared/utils/response.util');
      expect(sendErrorResponse).toHaveBeenCalled();
    });

    it('should throw error if payment window has expired', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const quote = createQuoteFixture({
        quoteId,
        userId: mockRequest.user?.userId ?? 'user-123',
        quotedAt: expiredDate,
        status: QuoteStatus.QUOTED,
      });

      mockRequest.params = { id: quoteId };
      mockQuoteRepository.findById.mockResolvedValue(quote);

      // Act
      await controller.getPaymentPage(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      const { sendErrorResponse } = await import('../../../shared/utils/response.util');
      expect(sendErrorResponse).toHaveBeenCalled();
    });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent for a valid quote', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userId = mockRequest.user?.userId || 'user-123';
      const result = {
        clientSecret: 'pi_test_123_secret',
        paymentIntentId: 'pi_test_123',
        paymentId: 'payment-123',
      };

      mockRequest.params = { id: quoteId };
      mockCreatePaymentIntentUseCase.execute.mockResolvedValue(result);

      // Act
      await controller.createPaymentIntent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockCreatePaymentIntentUseCase.execute).toHaveBeenCalledWith(quoteId, userId);
      const { sendSuccessResponse } = await import('../../../shared/utils/response.util');
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse as Response,
        200,
        result
      );
    });

    it('should throw error if user is not authenticated', async () => {
      // Arrange
      const quoteId = 'quote-123';
      mockRequest.params = { id: quoteId };
      mockRequest.user = undefined;

      // Act
      await controller.createPaymentIntent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      const { sendErrorResponse } = await import('../../../shared/utils/response.util');
      expect(sendErrorResponse).toHaveBeenCalled();
    });

    it('should throw error if quoteId is invalid', async () => {
      // Arrange
      mockRequest.params = { id: '' };

      // Act
      await controller.createPaymentIntent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      const { sendErrorResponse } = await import('../../../shared/utils/response.util');
      expect(sendErrorResponse).toHaveBeenCalled();
    });

    it('should handle use case errors', async () => {
      // Arrange
      const quoteId = 'quote-123';
      mockRequest.params = { id: quoteId };
      mockCreatePaymentIntentUseCase.execute.mockRejectedValue(
        new AppError('Quote not found', 'QUOTE_NOT_FOUND', 404)
      );

      // Act
      await controller.createPaymentIntent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      const { sendErrorResponse } = await import('../../../shared/utils/response.util');
      expect(sendErrorResponse).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should return 400 if stripe-signature header is missing', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await controller.handleWebhook(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith('Missing stripe-signature header');
    });

    it('should return 500 if webhook secret is not configured', async () => {
      // Arrange
      mockRequest.headers = { 'stripe-signature': 'test-signature' };
      
      // Temporarily set webhook secret to empty string using Object.defineProperty
      const originalSecret = configModule.STRIPE_CONFIG.WEBHOOK_SECRET;
      Object.defineProperty(configModule.STRIPE_CONFIG, 'WEBHOOK_SECRET', {
        value: '',
        writable: true,
        configurable: true,
      });

      // Act
      await controller.handleWebhook(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Webhook secret not configured');
      
      // Restore original value
      Object.defineProperty(configModule.STRIPE_CONFIG, 'WEBHOOK_SECRET', {
        value: originalSecret,
        writable: true,
        configurable: true,
      });
    });

    it('should return 400 if webhook signature verification fails', async () => {
      // Arrange
      const sig = 'invalid-signature';
      mockRequest.headers = { 'stripe-signature': sig };
      mockRequest.body = Buffer.from('test-body');

      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockImplementation(() => {
            throw new Error('Invalid signature');
          }),
        },
      };

      vi.mocked(stripeService.getStripeInstance).mockReturnValue(mockStripe as unknown as Stripe);

      // Act
      await controller.handleWebhook(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('Webhook Error')
      );
    });

    it('should successfully handle valid webhook event', async () => {
      // Arrange
      const sig = 'valid-signature';
      mockRequest.headers = { 'stripe-signature': sig };
      mockRequest.body = Buffer.from('test-body');

      const mockEvent: Partial<Stripe.Event> = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          } as Stripe.PaymentIntent,
        },
      };

      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockReturnValue(mockEvent),
        },
      };

      vi.mocked(stripeService.getStripeInstance).mockReturnValue(mockStripe as unknown as Stripe);
      mockHandlePaymentWebhookUseCase.execute.mockResolvedValue(undefined);

      // Act
      await controller.handleWebhook(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockRequest.body,
        sig,
        'whsec_test_secret'
      );
      expect(mockHandlePaymentWebhookUseCase.execute).toHaveBeenCalledWith({
        type: 'payment_intent.succeeded',
        data: mockEvent.data,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should return 500 if webhook handler fails', async () => {
      // Arrange
      const sig = 'valid-signature';
      mockRequest.headers = { 'stripe-signature': sig };
      mockRequest.body = Buffer.from('test-body');

      const mockEvent: Partial<Stripe.Event> = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          } as Stripe.PaymentIntent,
        },
      };

      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockReturnValue(mockEvent),
        },
      };

      vi.mocked(stripeService.getStripeInstance).mockReturnValue(mockStripe as unknown as Stripe);
      mockHandlePaymentWebhookUseCase.execute.mockRejectedValue(new Error('Handler failed'));

      // Act
      await controller.handleWebhook(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Webhook handler failed' });
    });
  });
});
