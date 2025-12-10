import { CreatePaymentIntentResponse } from '../../../dtos/payment.dto';

/**
 * Use case interface for creating a payment intent
 */
export interface ICreatePaymentIntentUseCase {
  execute(quoteId: string, userId: string): Promise<CreatePaymentIntentResponse>;
}
