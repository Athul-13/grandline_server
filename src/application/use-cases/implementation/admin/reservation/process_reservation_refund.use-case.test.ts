import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ProcessReservationRefundUseCase } from './process_reservation_refund.use-case';
import { MockReservationRepository } from '../../../../../shared/test/mocks/repositories/reservation_repository.mock';
import { MockPaymentRepository } from '../../../../../shared/test/mocks/repositories/payment_repository.mock';
import { MockReservationModificationRepository } from '../../../../../shared/test/mocks/repositories/reservation_modification_repository.mock';
import { MockUserRepository } from '../../../../../shared/test/mocks/repositories/user_repository.mock';
import { REPOSITORY_TOKENS, SERVICE_TOKENS, USE_CASE_TOKENS } from '../../../../di/tokens';
import { clearContainer } from '../../../../../shared/test/helpers/test_setup';
import { createConfirmedReservationFixture, createReservationFixture } from '../../../../../shared/test/fixtures/reservation.fixture';
import { createSucceededPaymentFixture } from '../../../../../shared/test/fixtures/payment.fixture';
import { createUserFixture } from '../../../../../shared/test/fixtures/user.fixture';
import { ReservationStatus } from '../../../../../shared/constants';
import { PaymentStatus } from '../../../../../domain/entities/payment.entity';
import * as stripeService from '../../../../../infrastructure/service/stripe.service';
import { ICreateNotificationUseCase } from '../../../interface/notification/create_notification_use_case.interface';
import { IEmailService } from '../../../../../domain/services/email_service.interface';
import Stripe from 'stripe';

// Mock the Stripe service
vi.mock('../../../../../infrastructure/services/stripe.service', () => ({
  getStripeInstance: vi.fn(),
}));

// Mock logger to avoid console output in tests
vi.mock('../../../../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ProcessReservationRefundUseCase', () => {
  let useCase: ProcessReservationRefundUseCase;
  let mockReservationRepository: MockReservationRepository;
  let mockPaymentRepository: MockPaymentRepository;
  let mockModificationRepository: MockReservationModificationRepository;
  let mockUserRepository: MockUserRepository;
  let mockCreateNotificationUseCase: ICreateNotificationUseCase;
  let mockEmailService: IEmailService;
  let mockNotificationExecute: ReturnType<typeof vi.fn>;
  let mockEmailSendEmail: ReturnType<typeof vi.fn>;
  let mockStripe: {
    refunds: {
      create: ReturnType<typeof vi.fn<[Stripe.RefundCreateParams], Promise<Stripe.Refund>>>;
    };
  };

  beforeEach(() => {
    clearContainer();

    // Create mock repositories
    mockReservationRepository = new MockReservationRepository();
    mockPaymentRepository = new MockPaymentRepository();
    mockModificationRepository = new MockReservationModificationRepository();
    mockUserRepository = new MockUserRepository();
    mockNotificationExecute = vi.fn().mockResolvedValue(undefined);
    mockCreateNotificationUseCase = {
      execute: mockNotificationExecute,
    } as unknown as ICreateNotificationUseCase;
    mockEmailSendEmail = vi.fn().mockResolvedValue(undefined);
    mockEmailService = {
      sendEmail: mockEmailSendEmail,
    } as unknown as IEmailService;

    // Register mocks in container
    container.registerInstance(REPOSITORY_TOKENS.IReservationRepository, mockReservationRepository);
    container.registerInstance(REPOSITORY_TOKENS.IPaymentRepository, mockPaymentRepository);
    container.registerInstance(
      REPOSITORY_TOKENS.IReservationModificationRepository,
      mockModificationRepository
    );
    container.registerInstance(REPOSITORY_TOKENS.IUserRepository, mockUserRepository);
    container.registerInstance(USE_CASE_TOKENS.CreateNotificationUseCase, mockCreateNotificationUseCase);
    container.registerInstance(SERVICE_TOKENS.IEmailService, mockEmailService);

    // Create mock Stripe instance
    mockStripe = {
      refunds: {
        create: vi.fn<[Stripe.RefundCreateParams], Promise<Stripe.Refund>>(),
      },
    };

    vi.mocked(stripeService.getStripeInstance).mockReturnValue(mockStripe as unknown as Stripe);

    // Create use case instance
    useCase = container.resolve(ProcessReservationRefundUseCase);
  });

  describe('execute', () => {
    it('should process a full refund successfully', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const paymentId = 'payment-123';
      const userId = 'user-123';
      const adminUserId = 'admin-123';
      const amount = 10000;
      const paymentIntentId = 'pi_test_123';
      const refundId = 're_test_123';

      const reservation = createConfirmedReservationFixture({
        reservationId,
        userId,
        paymentId,
        refundStatus: 'none',
        refundedAmount: 0,
      });

      const payment = createSucceededPaymentFixture({
        paymentId,
        amount,
        paymentIntentId,
      });

      const user = createUserFixture({
        userId,
        email: 'test@example.com',
        fullName: 'Test User',
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findById.mockResolvedValue(user);
      mockStripe.refunds.create.mockResolvedValue({
        id: refundId,
      } as Stripe.Refund);

      // Act
      const result = await useCase.execute(reservationId, amount, adminUserId);

      // Assert
      expect(result).toEqual({
        reservation: expect.any(Object),
        refundId,
      });
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
        amount: amount * 100, // Converted to cents
        reason: undefined,
        metadata: {
          reservationId,
          reason: '',
          refundedBy: adminUserId,
        },
      });
      expect(mockReservationRepository.updateById).toHaveBeenCalled();
      expect(mockModificationRepository.create).toHaveBeenCalled();
      expect(mockNotificationExecute).toHaveBeenCalled();
      expect(mockEmailSendEmail).toHaveBeenCalled();
    });

    it('should process a partial refund successfully', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const paymentId = 'payment-123';
      const userId = 'user-123';
      const adminUserId = 'admin-123';
      const totalAmount = 10000;
      const partialRefundAmount = 5000;
      const paymentIntentId = 'pi_test_123';
      const refundId = 're_test_123';

      const reservation = createConfirmedReservationFixture({
        reservationId,
        userId,
        paymentId,
        refundStatus: 'none',
        refundedAmount: 0,
      });

      const payment = createSucceededPaymentFixture({
        paymentId,
        amount: totalAmount,
        paymentIntentId,
      });

      const user = createUserFixture({
        userId,
        email: 'test@example.com',
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findById.mockResolvedValue(user);
      mockStripe.refunds.create.mockResolvedValue({
        id: refundId,
      } as Stripe.Refund);

      // Act
      const result = await useCase.execute(reservationId, partialRefundAmount, adminUserId);

      // Assert
      expect(result.refundId).toBe(refundId);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
        amount: partialRefundAmount * 100,
        reason: undefined,
        metadata: expect.any(Object),
      });
    });

    it('should throw error if reservation not found', async () => {
      // Arrange
      const reservationId = 'non-existent';
      mockReservationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(reservationId, 1000, 'admin-123')).rejects.toThrow(
        'Reservation not found'
      );
    });

    it('should throw error if reservation already refunded', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const reservation = createReservationFixture({
        reservationId,
        status: ReservationStatus.REFUNDED,
        refundStatus: 'full',
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);

      // Act & Assert
      await expect(useCase.execute(reservationId, 1000, 'admin-123')).rejects.toThrow(
        'Reservation has already been refunded'
      );
    });

    it('should throw error if payment not found', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const reservation = createConfirmedReservationFixture({
        reservationId,
        paymentId: 'payment-123',
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(reservationId, 1000, 'admin-123')).rejects.toThrow(
        'Payment not found'
      );
    });

    it('should throw error if refund amount exceeds maximum', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const paymentId = 'payment-123';
      const amount = 10000;
      const refundedAmount = 5000;
      const requestedRefund = 6000; // Exceeds available amount

      const reservation = createConfirmedReservationFixture({
        reservationId,
        paymentId,
        refundedAmount,
      });

      const payment = createSucceededPaymentFixture({
        paymentId,
        amount,
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(payment);

      // Act & Assert
      await expect(useCase.execute(reservationId, requestedRefund, 'admin-123')).rejects.toThrow(
        'Refund amount cannot exceed'
      );
    });

    it('should include reason in refund metadata when provided', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const paymentId = 'payment-123';
      const reason = 'Customer requested refund';
      const paymentIntentId = 'pi_test_123';

      const reservation = createConfirmedReservationFixture({
        reservationId,
        paymentId,
      });

      const payment = createSucceededPaymentFixture({
        paymentId,
        paymentIntentId,
      });

      const user = createUserFixture({
        userId: reservation.userId,
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findById.mockResolvedValue(user);
      mockStripe.refunds.create.mockResolvedValue({ id: 're_test_123' } as Stripe.Refund);

      // Act
      await useCase.execute(reservationId, 5000, 'admin-123', reason);

      // Assert
      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'requested_by_customer',
          metadata: expect.objectContaining({
            reason,
          }),
        })
      );
    });

    it('should update payment status to REFUNDED when fully refunded', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const paymentId = 'payment-123';
      const amount = 10000;

      const reservation = createConfirmedReservationFixture({
        reservationId,
        paymentId,
        refundedAmount: 0,
      });

      const payment = createSucceededPaymentFixture({
        paymentId,
        amount,
        paymentIntentId: 'pi_test_123',
      });

      const user = createUserFixture({
        userId: reservation.userId,
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findById.mockResolvedValue(user);
      mockStripe.refunds.create.mockResolvedValue({ id: 're_test_123' } as Stripe.Refund);

      // Act
      await useCase.execute(reservationId, amount, 'admin-123');

      // Assert
      expect(mockPaymentRepository.updateById).toHaveBeenCalledWith(
        paymentId,
        expect.objectContaining({
          status: PaymentStatus.REFUNDED,
        })
      );
    });

    it('should send notification to user after refund', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const paymentId = 'payment-123';
      const userId = 'user-123';
      const amount = 5000;
      const reason = 'Customer request';

      const reservation = createConfirmedReservationFixture({
        reservationId,
        userId,
        paymentId,
      });

      const payment = createSucceededPaymentFixture({
        paymentId,
        amount: 10000,
        paymentIntentId: 'pi_test_123',
      });

      const user = createUserFixture({
        userId,
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findById.mockResolvedValue(user);
      mockStripe.refunds.create.mockResolvedValue({ id: 're_test_123' } as Stripe.Refund);

      // Act
      await useCase.execute(reservationId, amount, 'admin-123', reason);

      // Assert
      expect(mockNotificationExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          data: expect.objectContaining({
            reservationId,
            refundAmount: amount,
            refundId: 're_test_123',
            reason,
          }),
        })
      );
    });

    it('should send refund confirmation email to user', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const paymentId = 'payment-123';
      const userId = 'user-123';
      const amount = 5000;
      const userEmail = 'test@example.com';
      const userName = 'Test User';

      const reservation = createConfirmedReservationFixture({
        reservationId,
        userId,
        paymentId,
        tripName: 'Test Trip',
      });

      const payment = createSucceededPaymentFixture({
        paymentId,
        amount: 10000,
        paymentIntentId: 'pi_test_123',
        currency: 'inr',
      });

      const user = createUserFixture({
        userId,
        email: userEmail,
        fullName: userName,
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockUserRepository.findById.mockResolvedValue(user);
      mockStripe.refunds.create.mockResolvedValue({ id: 're_test_123' } as Stripe.Refund);

      // Act
      await useCase.execute(reservationId, amount, 'admin-123');

      // Assert
      expect(mockEmailSendEmail).toHaveBeenCalledWith(
        expect.any(String), // EmailType.REFUND_CONFIRMATION
        expect.objectContaining({
          email: userEmail,
          fullName: userName,
          reservationId,
          refundAmount: amount,
          refundId: 're_test_123',
          currency: 'inr',
          isFullRefund: false,
        })
      );
    });

    it('should handle Stripe refund failure gracefully', async () => {
      // Arrange
      const reservationId = 'reservation-123';
      const paymentId = 'payment-123';

      const reservation = createConfirmedReservationFixture({
        reservationId,
        paymentId,
      });

      const payment = createSucceededPaymentFixture({
        paymentId,
        paymentIntentId: 'pi_test_123',
      });

      mockReservationRepository.findById.mockResolvedValue(reservation);
      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockStripe.refunds.create.mockRejectedValue(new Error('Stripe API error'));

      // Act & Assert
      await expect(useCase.execute(reservationId, 5000, 'admin-123')).rejects.toThrow(
        'Failed to process refund'
      );
    });
  });
});

