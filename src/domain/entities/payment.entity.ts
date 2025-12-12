/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

/**
 * Payment domain entity representing a payment transaction
 * Contains core business logic and validation rules
 */
export class Payment {
  constructor(
    public readonly paymentId: string,
    public readonly quoteId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly status: PaymentStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly paymentIntentId?: string,
    public readonly transactionId?: string,
    public readonly paidAt?: Date,
    public readonly metadata?: Record<string, unknown>
  ) {}

  /**
   * Checks if the payment is pending
   */
  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  /**
   * Checks if the payment has succeeded
   */
  isSucceeded(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }

  /**
   * Checks if the payment has failed
   */
  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  /**
   * Checks if the payment can be refunded
   */
  canBeRefunded(): boolean {
    return this.isSucceeded() && !this.isRefunded();
  }

  /**
   * Checks if the payment has been refunded
   */
  isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED;
  }
}
