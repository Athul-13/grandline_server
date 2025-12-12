import { Payment } from '../entities/payment.entity';
import { IBaseRepository } from './base_repository.interface';
import { PaymentStatus } from '../entities/payment.entity';

/**
 * Repository interface for Payment entity operations
 * Defines the contract for data access layer implementations
 */
export interface IPaymentRepository extends IBaseRepository<Payment> {
  /**
   * Finds payments by quote ID
   */
  findByQuoteId(quoteId: string): Promise<Payment[]>;

  /**
   * Finds payment by Stripe payment intent ID
   */
  findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null>;

  /**
   * Finds payments by user ID
   */
  findByUserId(userId: string): Promise<Payment[]>;

  /**
   * Finds payments by status
   */
  findByStatus(status: PaymentStatus): Promise<Payment[]>;
}
