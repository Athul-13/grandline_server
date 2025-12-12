import { vi } from 'vitest';
import { IPaymentRepository } from '../../../../domain/repositories/payment_repository.interface';
import { Payment } from '../../../../domain/entities/payment.entity';
import { PaymentStatus } from '../../../../domain/entities/payment.entity';

/**
 * Mock implementation of IPaymentRepository
 * Use this in unit tests to avoid database dependencies
 */
export class MockPaymentRepository implements IPaymentRepository {
  findById = vi.fn<[string], Promise<Payment | null>>().mockResolvedValue(null);
  create = vi.fn<[Payment], Promise<void>>().mockResolvedValue(undefined);
  updateById = vi.fn<[string, Partial<Payment>], Promise<void>>().mockResolvedValue(undefined);
  deleteById = vi.fn<[string], Promise<void>>().mockResolvedValue(undefined);
  findByQuoteId = vi.fn<[string], Promise<Payment[]>>().mockResolvedValue([]);
  findByPaymentIntentId = vi.fn<[string], Promise<Payment | null>>().mockResolvedValue(null);
  findByUserId = vi.fn<[string], Promise<Payment[]>>().mockResolvedValue([]);
  findByStatus = vi.fn<[PaymentStatus], Promise<Payment[]>>().mockResolvedValue([]);
}

