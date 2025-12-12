import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { PaymentRepositoryImpl } from './payment.repository';
import { disconnectTestDatabase, clearTestDatabase } from '../../shared/test/helpers/database_helper';
import {
  createPaymentFixture,
  createPendingPaymentFixture,
  createSucceededPaymentFixture,
  createFailedPaymentFixture,
} from '../../shared/test/fixtures/payment.fixture';
import { PaymentStatus, PaymentMethod } from '../../domain/entities/payment.entity';

// Mock logger to avoid console output in tests
vi.mock('../../shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('PaymentRepositoryImpl (Integration)', () => {
  let repository: PaymentRepositoryImpl;
  const TEST_DB_URI = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test_db';

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) {
      await mongoose.connect(TEST_DB_URI);
    }
    repository = new PaymentRepositoryImpl();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await clearTestDatabase();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearTestDatabase();
  });

  describe('create', () => {
    it('should create a new payment in the database', async () => {
      // Arrange
      const payment = createPendingPaymentFixture({
        paymentId: 'test-payment-1',
        quoteId: 'quote-1',
        userId: 'user-1',
        amount: 10000,
        currency: 'inr',
        paymentMethod: PaymentMethod.STRIPE,
      });

      // Act
      await repository.create(payment);

      // Assert
      const found = await repository.findById(payment.paymentId);
      expect(found).not.toBeNull();
      expect(found?.paymentId).toBe(payment.paymentId);
      expect(found?.quoteId).toBe(payment.quoteId);
      expect(found?.userId).toBe(payment.userId);
      expect(found?.amount).toBe(payment.amount);
      expect(found?.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('findById', () => {
    it('should find a payment by ID', async () => {
      // Arrange
      const payment = createPendingPaymentFixture({
        paymentId: 'test-payment-2',
        quoteId: 'quote-1',
        userId: 'user-1',
      });
      await repository.create(payment);

      // Act
      const found = await repository.findById(payment.paymentId);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.paymentId).toBe(payment.paymentId);
    });

    it('should return null if payment does not exist', async () => {
      // Act
      const found = await repository.findById('non-existent-id');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update a payment by ID', async () => {
      // Arrange
      const payment = createPendingPaymentFixture({
        paymentId: 'test-payment-3',
        quoteId: 'quote-1',
        userId: 'user-1',
      });
      await repository.create(payment);

      // Act
      await repository.updateById(payment.paymentId, {
        status: PaymentStatus.SUCCEEDED,
        transactionId: 'ch_test_123',
        paidAt: new Date(),
      });

      // Assert
      const updated = await repository.findById(payment.paymentId);
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe(PaymentStatus.SUCCEEDED);
      expect(updated?.transactionId).toBe('ch_test_123');
      expect(updated?.paidAt).not.toBeUndefined();
    });
  });

  describe('findByQuoteId', () => {
    it('should find all payments for a quote', async () => {
      // Arrange
      const quoteId = 'quote-1';
      const payment1 = createPendingPaymentFixture({
        paymentId: 'test-payment-4',
        quoteId,
        userId: 'user-1',
      });
      const payment2 = createSucceededPaymentFixture({
        paymentId: 'test-payment-5',
        quoteId,
        userId: 'user-1',
      });
      await repository.create(payment1);
      await repository.create(payment2);

      // Act
      const found = await repository.findByQuoteId(quoteId);

      // Assert
      expect(found).toHaveLength(2);
      expect(found.map((p) => p.paymentId)).toContain(payment1.paymentId);
      expect(found.map((p) => p.paymentId)).toContain(payment2.paymentId);
    });

    it('should return empty array if no payments found for quote', async () => {
      // Act
      const found = await repository.findByQuoteId('non-existent-quote');

      // Assert
      expect(found).toHaveLength(0);
    });
  });

  describe('findByPaymentIntentId', () => {
    it('should find a payment by payment intent ID', async () => {
      // Arrange
      const paymentIntentId = 'pi_test_123';
      const payment = createPendingPaymentFixture({
        paymentId: 'test-payment-6',
        quoteId: 'quote-1',
        userId: 'user-1',
        paymentIntentId,
      });
      await repository.create(payment);

      // Act
      const found = await repository.findByPaymentIntentId(paymentIntentId);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.paymentIntentId).toBe(paymentIntentId);
      expect(found?.paymentId).toBe(payment.paymentId);
    });

    it('should return null if payment intent ID does not exist', async () => {
      // Act
      const found = await repository.findByPaymentIntentId('non-existent-pi');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all payments for a user', async () => {
      // Arrange
      const userId = 'user-1';
      const payment1 = createPendingPaymentFixture({
        paymentId: 'test-payment-7',
        quoteId: 'quote-1',
        userId,
      });
      const payment2 = createSucceededPaymentFixture({
        paymentId: 'test-payment-8',
        quoteId: 'quote-2',
        userId,
      });
      await repository.create(payment1);
      await repository.create(payment2);

      // Act
      const found = await repository.findByUserId(userId);

      // Assert
      expect(found).toHaveLength(2);
      expect(found.map((p) => p.paymentId)).toContain(payment1.paymentId);
      expect(found.map((p) => p.paymentId)).toContain(payment2.paymentId);
    });

    it('should return empty array if no payments found for user', async () => {
      // Act
      const found = await repository.findByUserId('non-existent-user');

      // Assert
      expect(found).toHaveLength(0);
    });
  });

  describe('findByStatus', () => {
    it('should find all payments with a specific status', async () => {
      // Arrange
      const payment1 = createPendingPaymentFixture({
        paymentId: 'test-payment-9',
        quoteId: 'quote-1',
        userId: 'user-1',
      });
      const payment2 = createPendingPaymentFixture({
        paymentId: 'test-payment-10',
        quoteId: 'quote-2',
        userId: 'user-1',
      });
      const payment3 = createSucceededPaymentFixture({
        paymentId: 'test-payment-11',
        quoteId: 'quote-3',
        userId: 'user-1',
      });
      await repository.create(payment1);
      await repository.create(payment2);
      await repository.create(payment3);

      // Act
      const found = await repository.findByStatus(PaymentStatus.PENDING);

      // Assert
      expect(found).toHaveLength(2);
      expect(found.every((p) => p.status === PaymentStatus.PENDING)).toBe(true);
    });

    it('should return empty array if no payments found with status', async () => {
      // Act
      const found = await repository.findByStatus(PaymentStatus.REFUNDED);

      // Assert
      expect(found).toHaveLength(0);
    });
  });

  describe('deleteById', () => {
    it('should delete a payment by ID', async () => {
      // Arrange
      const payment = createPendingPaymentFixture({
        paymentId: 'test-payment-12',
        quoteId: 'quote-1',
        userId: 'user-1',
      });
      await repository.create(payment);

      // Act
      await repository.deleteById(payment.paymentId);

      // Assert
      const found = await repository.findById(payment.paymentId);
      expect(found).toBeNull();
    });
  });

  describe('Payment entity mapping', () => {
    it('should correctly map payment with all optional fields', async () => {
      // Arrange
      const payment = createSucceededPaymentFixture({
        paymentId: 'test-payment-13',
        quoteId: 'quote-1',
        userId: 'user-1',
        paymentIntentId: 'pi_test_123',
        transactionId: 'ch_test_123',
        metadata: { key: 'value' },
      });
      await repository.create(payment);

      // Act
      const found = await repository.findById(payment.paymentId);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.paymentIntentId).toBe('pi_test_123');
      expect(found?.transactionId).toBe('ch_test_123');
      expect(found?.paidAt).not.toBeUndefined();
      expect(found?.metadata).toEqual({ key: 'value' });
    });

    it('should correctly map payment without optional fields', async () => {
      // Arrange
      const payment = createPendingPaymentFixture({
        paymentId: 'test-payment-14',
        quoteId: 'quote-1',
        userId: 'user-1',
      });
      await repository.create(payment);

      // Act
      const found = await repository.findById(payment.paymentId);

      // Assert
      expect(found).not.toBeNull();
      expect(found?.paymentIntentId).toBeUndefined();
      expect(found?.transactionId).toBeUndefined();
      expect(found?.paidAt).toBeUndefined();
    });
  });
});
