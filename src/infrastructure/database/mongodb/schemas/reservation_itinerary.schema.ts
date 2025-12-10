import { Schema } from 'mongoose';
import { StopType } from '../../../../shared/constants';

/**
 * MongoDB schema for ReservationItinerary collection
 */
export const ReservationItinerarySchema: Schema = new Schema(
  {
    itineraryId: {
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
    tripType: {
      type: String,
      enum: ['outbound', 'return'],
      required: true,
      index: true,
    },
    stopOrder: {
      type: Number,
      required: true,
      min: 0,
    },
    locationName: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    arrivalTime: {
      type: Date,
      required: true,
    },
    departureTime: {
      type: Date,
      required: false,
    },
    isDriverStaying: {
      type: Boolean,
      default: false,
      required: true,
    },
    stayingDuration: {
      type: Number,
      required: false,
      min: 0,
    },
    stopType: {
      type: String,
      enum: Object.values(StopType),
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'reservation_itinerary',
  }
);

// Add indexes
ReservationItinerarySchema.index({ itineraryId: 1 });
ReservationItinerarySchema.index({ reservationId: 1 });
ReservationItinerarySchema.index({ reservationId: 1, tripType: 1 });
ReservationItinerarySchema.index({ reservationId: 1, stopOrder: 1 });
// Add indexes for date range queries (for availability checking)
ReservationItinerarySchema.index({ arrivalTime: 1 });
ReservationItinerarySchema.index({ departureTime: 1 });
ReservationItinerarySchema.index({ reservationId: 1, arrivalTime: 1 });

