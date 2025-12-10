import { describe, it, expect } from 'vitest';
import { Payment, PaymentStatus, PaymentMethod } from './payment.entity';

describe('Payment Entity', () => {
  describe('isPending', () => {
    it('should return true when status is PENDING', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.PENDING,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.isPending()).toBe(true);
    });

    it('should return false when status is not PENDING', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.SUCCEEDED,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.isPending()).toBe(false);
    });
  });

  describe('isSucceeded', () => {
    it('should return true when status is SUCCEEDED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.SUCCEEDED,
        new Date(),
        new Date(),
        undefined,
        undefined,
        new Date()
      );

      // Act & Assert
      expect(payment.isSucceeded()).toBe(true);
    });

    it('should return false when status is not SUCCEEDED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.PENDING,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.isSucceeded()).toBe(false);
    });
  });

  describe('isFailed', () => {
    it('should return true when status is FAILED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.FAILED,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.isFailed()).toBe(true);
    });

    it('should return false when status is not FAILED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.SUCCEEDED,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.isFailed()).toBe(false);
    });
  });

  describe('isRefunded', () => {
    it('should return true when status is REFUNDED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.REFUNDED,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.isRefunded()).toBe(true);
    });

    it('should return false when status is not REFUNDED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.SUCCEEDED,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.isRefunded()).toBe(false);
    });
  });

  describe('canBeRefunded', () => {
    it('should return true when payment is SUCCEEDED and not REFUNDED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.SUCCEEDED,
        new Date(),
        new Date(),
        undefined,
        undefined,
        new Date()
      );

      // Act & Assert
      expect(payment.canBeRefunded()).toBe(true);
    });

    it('should return false when payment is not SUCCEEDED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.PENDING,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.canBeRefunded()).toBe(false);
    });

    it('should return false when payment is already REFUNDED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.REFUNDED,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.canBeRefunded()).toBe(false);
    });

    it('should return false when payment is FAILED', () => {
      // Arrange
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.FAILED,
        new Date(),
        new Date()
      );

      // Act & Assert
      expect(payment.canBeRefunded()).toBe(false);
    });
  });

  describe('Payment entity properties', () => {
    it('should correctly initialize all properties', () => {
      // Arrange
      const paymentId = 'payment-1';
      const quoteId = 'quote-1';
      const userId = 'user-1';
      const amount = 10000;
      const currency = 'inr';
      const paymentMethod = PaymentMethod.STRIPE;
      const status = PaymentStatus.PENDING;
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const paymentIntentId = 'pi_test_123';
      const transactionId = 'ch_test_123';
      const paidAt = new Date('2024-01-03');
      const metadata = { key: 'value' };

      // Act
      const payment = new Payment(
        paymentId,
        quoteId,
        userId,
        amount,
        currency,
        paymentMethod,
        status,
        createdAt,
        updatedAt,
        paymentIntentId,
        transactionId,
        paidAt,
        metadata
      );

      // Assert
      expect(payment.paymentId).toBe(paymentId);
      expect(payment.quoteId).toBe(quoteId);
      expect(payment.userId).toBe(userId);
      expect(payment.amount).toBe(amount);
      expect(payment.currency).toBe(currency);
      expect(payment.paymentMethod).toBe(paymentMethod);
      expect(payment.status).toBe(status);
      expect(payment.createdAt).toBe(createdAt);
      expect(payment.updatedAt).toBe(updatedAt);
      expect(payment.paymentIntentId).toBe(paymentIntentId);
      expect(payment.transactionId).toBe(transactionId);
      expect(payment.paidAt).toBe(paidAt);
      expect(payment.metadata).toBe(metadata);
    });

    it('should allow optional properties to be undefined', () => {
      // Arrange & Act
      const payment = new Payment(
        'payment-1',
        'quote-1',
        'user-1',
        10000,
        'inr',
        PaymentMethod.STRIPE,
        PaymentStatus.PENDING,
        new Date(),
        new Date()
      );

      // Assert
      expect(payment.paymentIntentId).toBeUndefined();
      expect(payment.transactionId).toBeUndefined();
      expect(payment.paidAt).toBeUndefined();
      expect(payment.metadata).toBeUndefined();
    });
  });
});
