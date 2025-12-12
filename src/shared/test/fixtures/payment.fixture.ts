import { Payment, PaymentStatus, PaymentMethod } from '../../../domain/entities/payment.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test fixture factory for Payment entity
 * Provides helper functions to create Payment instances for testing
 */

interface PaymentFixtureOptions {
  paymentId?: string;
  quoteId?: string;
  userId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  paymentIntentId?: string;
  transactionId?: string;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a Payment fixture with default values
 * Override specific properties as needed for your test
 */
export function createPaymentFixture(options: PaymentFixtureOptions = {}): Payment {
  const now = new Date();
  const paymentId = options.paymentId || uuidv4();
  const quoteId = options.quoteId || uuidv4();
  const userId = options.userId || uuidv4();

  return new Payment(
    paymentId,
    quoteId,
    userId,
    options.amount || 10000,
    options.currency || 'inr',
    options.paymentMethod || PaymentMethod.STRIPE,
    options.status || PaymentStatus.PENDING,
    options.createdAt || now,
    options.updatedAt || now,
    options.paymentIntentId,
    options.transactionId,
    options.paidAt,
    options.metadata
  );
}

/**
 * Creates a Payment fixture in PENDING status
 */
export function createPendingPaymentFixture(
  options: Omit<PaymentFixtureOptions, 'status'> = {}
): Payment {
  return createPaymentFixture({ ...options, status: PaymentStatus.PENDING });
}

/**
 * Creates a Payment fixture in SUCCEEDED status
 */
export function createSucceededPaymentFixture(
  options: Omit<PaymentFixtureOptions, 'status' | 'paidAt'> & { paidAt?: Date } = {}
): Payment {
  return createPaymentFixture({
    ...options,
    status: PaymentStatus.SUCCEEDED,
    paidAt: options.paidAt || new Date(),
  });
}

/**
 * Creates a Payment fixture in FAILED status
 */
export function createFailedPaymentFixture(
  options: Omit<PaymentFixtureOptions, 'status'> = {}
): Payment {
  return createPaymentFixture({ ...options, status: PaymentStatus.FAILED });
}

/**
 * Creates a Payment fixture with Stripe payment intent
 */
export function createPaymentWithIntentFixture(
  paymentIntentId: string,
  options: Omit<PaymentFixtureOptions, 'paymentIntentId'> = {}
): Payment {
  return createPaymentFixture({
    ...options,
    paymentIntentId,
    metadata: {
      ...options.metadata,
      stripePaymentIntentId: paymentIntentId,
    },
  });
}

