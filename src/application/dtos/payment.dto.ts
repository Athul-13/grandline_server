import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Request DTO for creating a payment intent
 */
export class CreatePaymentIntentRequest {
  @IsString()
  @IsNotEmpty()
  quoteId!: string;
}

/**
 * Response DTO for creating a payment intent
 */
export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  paymentId: string;
}
