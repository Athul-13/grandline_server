import { Schema } from 'mongoose';

/**
 * Schema for DriverPayment
 * Represents the structure of a document in the driver_payments collection
 */
export const DriverPaymentSchema: Schema = new Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    driverId: {
        type: String,
        required: true,
        index: true,
    },
    reservationId: {
        type: String,
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
    collection: 'driver_payments',
});

DriverPaymentSchema.index({ paymentId: 1 });
DriverPaymentSchema.index({ driverId: 1 });
DriverPaymentSchema.index({ driverId: 1, createdAt: -1 });
DriverPaymentSchema.index({ reservationId: 1 });
DriverPaymentSchema.index({ createdAt: -1 });
DriverPaymentSchema.index({ updatedAt: -1 });