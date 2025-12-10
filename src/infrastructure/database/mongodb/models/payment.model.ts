import mongoose, { Document } from 'mongoose';
import { PaymentSchema } from '../schemas/payment.schema';
import { PaymentStatus, PaymentMethod } from '../../../../domain/entities/payment.entity';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * Payment MongoDB document interface
 * Represents the structure of a payment document in MongoDB
 */
export interface IPaymentModel extends Document {
  paymentId: string;
  quoteId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentIntentId?: string;
  transactionId?: string;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Payment
 */
export const PaymentDB = mongoose.model<IPaymentModel>('Payment', PaymentSchema);

/**
 * Creates an IDatabaseModel instance for Payment
 */
export function createPaymentModel(): IDatabaseModel<IPaymentModel> {
  return new MongoDBModelImpl<IPaymentModel>(PaymentDB);
}
