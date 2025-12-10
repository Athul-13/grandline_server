import { Schema } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '../../../../domain/entities/payment.entity';

/**
 * MongoDB schema for Payment collection
 */
export const PaymentSchema: Schema = new Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    quoteId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
      index: true,
    },
    paymentIntentId: {
      type: String,
      required: false,
      index: true,
    },
    transactionId: {
      type: String,
      required: false,
    },
    paidAt: {
      type: Date,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

// Add indexes
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ quoteId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ paymentIntentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ quoteId: 1, status: 1 });
