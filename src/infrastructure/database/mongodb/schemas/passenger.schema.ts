import { Schema } from 'mongoose';

/**
 * MongoDB schema for Passenger collection
 */
export const PassengerSchema: Schema = new Schema(
  {
    passengerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    quoteId: {
      type: String,
      required: false,
      index: true,
    },
    reservationId: {
      type: String,
      required: false,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 150,
    },
  },
  {
    timestamps: true,
    collection: 'passengers',
  }
);

// Add indexes
PassengerSchema.index({ passengerId: 1 });
PassengerSchema.index({ quoteId: 1 });
PassengerSchema.index({ reservationId: 1 });
PassengerSchema.index({ createdAt: -1 });

