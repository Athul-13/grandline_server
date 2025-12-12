import { Schema } from 'mongoose';

/**
 * MongoDB schema for ReservationModification collection
 */
export const ReservationModificationSchema: Schema = new Schema(
  {
    modificationId: {
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
    modifiedBy: {
      type: String,
      required: true,
      index: true,
    },
    modificationType: {
      type: String,
      enum: ['driver_change', 'passenger_add', 'vehicle_adjust', 'status_change', 'charge_add', 'other'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    previousValue: {
      type: String,
      required: false,
    },
    newValue: {
      type: String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'reservation_modifications',
  }
);

// Add indexes
ReservationModificationSchema.index({ modificationId: 1 });
ReservationModificationSchema.index({ reservationId: 1 });
ReservationModificationSchema.index({ reservationId: 1, createdAt: -1 }); // For chronological order
ReservationModificationSchema.index({ modifiedBy: 1 });
ReservationModificationSchema.index({ modificationType: 1 });

