import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ProcessReservationRefundUseCase } from './process_reservation_refund.use-case';
import { REPOSITORY_TOKENS, SERVICE_TOKENS, USE_CASE_TOKENS } from '../../../../di/tokens';
import { clearContainer } from '../../../../../shared/test/helpers/test_setup';
import {
  connectTestDatabase,
  disconnectTestDatabase,
  clearTestDatabase,
} from '../../../../../shared/test/helpers/database_helper';
import { ReservationStatus } from '../../../../../shared/constants';
import { PaymentStatus } from '../../../../../domain/entities/payment.entity';
import { ReservationRepositoryImpl } from '../../../../../infrastructure/repositories/reservation.repository';
import { PaymentRepositoryImpl } from '../../../../../infrastructure/repositories/payment.repository';
import { ReservationModificationRepositoryImpl } from '../../../../../infrastructure/repositories/reservation_modification.repository';
import { UserRepositoryImpl } from '../../../../../infrastructure/repositories/user.repository';
import { NotificationRepositoryImpl } from '../../../../../infrastructure/repositories/notification.repository';
import { CreateNotificationUseCase } from '../../notification/create_notification.use-case';
import { EmailServiceImpl } from '../../../../../infrastructure/service/email.service';
import { createConfirmedReservationFixture } from '../../../../../shared/test/fixtures/reservation.fixture';
import { createSucceededPaymentFixture } from '../../../../../shared/test/fixtures/payment.fixture';
import { createUserFixture } from '../../../../../shared/test/fixtures/user.fixture';
import * as stripeService from '../../../../../infrastructure/service/stripe.service';

// Mock Stripe service for integration tests
vi.mock('../../../../../infrastructure/services/stripe.service', () => ({
  getStripeInstance: vi.fn(),
}));

// Mock logger
vi.mock('../../../../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ProcessReservationRefundUseCase - Integration Tests', () => {
  let useCase: ProcessReservationRefundUseCase;
  let reservationRepository: ReservationRepositoryImpl;
  let paymentRepository: PaymentRepositoryImpl;
  let modificationRepository: ReservationModificationRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let mockStripe: {
    refunds: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    clearContainer();

    // Register real repositories
    reservationRepository = container.resolve(ReservationRepositoryImpl);
    paymentRepository = container.resolve(PaymentRepositoryImpl);
    modificationRepository = container.resolve(ReservationModificationRepositoryImpl);
    userRepository = container.resolve(UserRepositoryImpl);

    container.registerInstance(REPOSITORY_TOKENS.IReservationRepository, reservationRepository);
    container.registerInstance(REPOSITORY_TOKENS.IPaymentRepository, paymentRepository);
    container.registerInstance(REPOSITORY_TOKENS.IReservationModificationRepository, modificationRepository);
    container.registerInstance(REPOSITORY_TOKENS.IUserRepository, userRepository);

    // Register notification repository needed by CreateNotificationUseCase
    const notificationRepository = container.resolve(NotificationRepositoryImpl);
    container.registerInstance(REPOSITORY_TOKENS.INotificationRepository, notificationRepository);

    // Register use cases and services needed by ProcessReservationRefundUseCase
    const createNotificationUseCase = container.resolve(CreateNotificationUseCase);
    const emailService = container.resolve(EmailServiceImpl);
    container.registerInstance(USE_CASE_TOKENS.CreateNotificationUseCase, createNotificationUseCase);
    container.registerInstance(SERVICE_TOKENS.IEmailService, emailService);

    // Mock Stripe
    mockStripe = {
      refunds: {
        create: vi.fn(),
      },
    };
    vi.mocked(stripeService.getStripeInstance).mockReturnValue(mockStripe as any);

    useCase = container.resolve(ProcessReservationRefundUseCase);
  });

  it('should process full refund end-to-end', async () => {
    // Arrange
    const userId = 'user-integration-test';
    const paymentId = 'payment-integration-test';
    const reservationId = 'reservation-integration-test';
    const amount = 10000;
    const paymentIntentId = 'pi_integration_test';
    const refundId = 're_integration_test';

    // Create user
    const user = createUserFixture({
      userId,
      email: 'integration-test@example.com',
      fullName: 'Integration Test User',
    });
    await userRepository.create(user);

    // Create payment
    const payment = createSucceededPaymentFixture({
      paymentId,
      quoteId: 'quote-test',
      userId,
      amount,
      paymentIntentId,
    });
    await paymentRepository.create(payment);

    // Create reservation
    const reservation = createConfirmedReservationFixture({
      reservationId,
      userId,
      paymentId,
      quoteId: 'quote-test',
      refundStatus: 'none',
      refundedAmount: 0,
    });
    await reservationRepository.create(reservation);

    // Mock Stripe refund
    mockStripe.refunds.create.mockResolvedValue({
      id: refundId,
    } as any);

    // Act
    const result = await useCase.execute(reservationId, amount, 'admin-user', 'Integration test refund');

    // Assert
    expect(result.refundId).toBe(refundId);

    // Verify reservation was updated
    const updatedReservation = await reservationRepository.findById(reservationId);
    expect(updatedReservation).not.toBeNull();
    expect(updatedReservation?.refundedAmount).toBe(amount);
    expect(updatedReservation?.refundStatus).toBe('full');
    expect(updatedReservation?.status).toBe(ReservationStatus.REFUNDED);

    // Verify payment status was updated
    const updatedPayment = await paymentRepository.findById(paymentId);
    expect(updatedPayment?.status).toBe(PaymentStatus.REFUNDED);

    // Verify modification record was created
    const modifications = await modificationRepository.findByReservationId(reservationId);
    expect(modifications.length).toBeGreaterThan(0);
    expect(modifications[0].modificationType).toBe('other');
  });

  it('should process partial refund end-to-end', async () => {
    // Arrange
    const userId = 'user-partial-test';
    const paymentId = 'payment-partial-test';
    const reservationId = 'reservation-partial-test';
    const totalAmount = 10000;
    const partialRefund = 5000;
    const paymentIntentId = 'pi_partial_test';
    const refundId = 're_partial_test';

    // Create user
    const user = createUserFixture({
      userId,
      email: 'partial-test@example.com',
    });
    await userRepository.create(user);

    // Create payment
    const payment = createSucceededPaymentFixture({
      paymentId,
      quoteId: 'quote-test',
      userId,
      amount: totalAmount,
      paymentIntentId,
    });
    await paymentRepository.create(payment);

    // Create reservation
    const reservation = createConfirmedReservationFixture({
      reservationId,
      userId,
      paymentId,
      quoteId: 'quote-test',
      refundStatus: 'none',
      refundedAmount: 0,
    });
    await reservationRepository.create(reservation);

    // Mock Stripe refund
    mockStripe.refunds.create.mockResolvedValue({
      id: refundId,
    } as any);

    // Act
    const result = await useCase.execute(reservationId, partialRefund, 'admin-user');

    // Assert
    expect(result.refundId).toBe(refundId);

    // Verify reservation was updated
    const updatedReservation = await reservationRepository.findById(reservationId);
    expect(updatedReservation?.refundedAmount).toBe(partialRefund);
    expect(updatedReservation?.refundStatus).toBe('partial');
    expect(updatedReservation?.status).toBe(ReservationStatus.CONFIRMED); // Should remain confirmed for partial refund

    // Verify payment status was NOT updated to REFUNDED (partial refund)
    const updatedPayment = await paymentRepository.findById(paymentId);
    expect(updatedPayment?.status).toBe(PaymentStatus.SUCCEEDED);
  });
});

