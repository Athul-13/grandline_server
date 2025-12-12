import { CreatePaymentIntentResponse } from '../../../dtos/payment.dto';

/**
 * Interface for creating payment intent for reservation charge
 */
export interface ICreateChargePaymentIntentUseCase {
  execute(reservationId: string, chargeId: string, userId: string): Promise<CreatePaymentIntentResponse>;
}

