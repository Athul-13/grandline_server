import { Schema } from 'mongoose';

/**
 * MongoDB schema for ReservationCharge collection
 */
export const ReservationChargeSchema: Schema = new Schema(
  {
    chargeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reservationId: {
      type: String,
      required: true,
      index: true,
    },
    chargeType: {
      type: String,
      enum: ['additional_passenger', 'vehicle_upgrade', 'amenity_add', 'late_fee', 'other'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    addedBy: {
      type: String,
      required: true,
      index: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    paidAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'reservation_charges',
  }
);

// Add indexes
ReservationChargeSchema.index({ chargeId: 1 });
ReservationChargeSchema.index({ reservationId: 1 });
ReservationChargeSchema.index({ reservationId: 1, isPaid: 1 }); // For unpaid charges query
ReservationChargeSchema.index({ addedBy: 1 });
ReservationChargeSchema.index({ chargeType: 1 });

