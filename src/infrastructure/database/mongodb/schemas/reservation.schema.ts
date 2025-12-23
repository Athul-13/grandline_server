import { Schema } from 'mongoose';
import { ReservationStatus, TripType } from '../../../../shared/constants';

/**
 * MongoDB schema for Reservation collection
 */
export const ReservationSchema: Schema = new Schema(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    quoteId: {
      type: String,
      required: true,
      index: true,
    },
    paymentId: {
      type: String,
      required: true,
      index: true,
    },
    tripType: {
      type: String,
      enum: Object.values(TripType),
      required: true,
      index: true,
    },
    tripName: {
      type: String,
      required: false,
      trim: true,
    },
    eventType: {
      type: String,
      required: false,
      trim: true,
    },
    customEventType: {
      type: String,
      required: false,
      trim: true,
    },
    passengerCount: {
      type: Number,
      required: false,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.CONFIRMED,
      required: true,
      index: true,
    },
    selectedVehicles: {
      type: [
        {
          vehicleId: { type: String, required: true },
          quantity: { type: Number, required: true, min: 1 },
        },
      ],
      required: false,
      default: [],
    },
    selectedAmenities: {
      type: [String],
      required: false,
      default: [],
    },
    routeData: {
      outbound: {
        totalDistance: { type: Number, required: false },
        totalDuration: { type: Number, required: false },
        routeGeometry: { type: String, required: false },
      },
      return: {
        totalDistance: { type: Number, required: false },
        totalDuration: { type: Number, required: false },
        routeGeometry: { type: String, required: false },
      },
    },
    assignedDriverId: {
      type: String,
      required: false,
      index: true,
    },
    originalDriverId: {
      type: String,
      required: false,
    },
    originalPricing: {
      total: { type: Number, required: false },
      currency: { type: String, required: false, default: 'INR' },
      paidAt: { type: Date, required: false },
    },
    reservationDate: {
      type: Date,
      required: true,
      index: true,
    },
    confirmedAt: {
      type: Date,
      required: false,
    },
    driverChangedAt: {
      type: Date,
      required: false,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'partial', 'full'],
      default: 'none',
      required: false,
    },
    refundedAmount: {
      type: Number,
      required: false,
      min: 0,
    },
    refundedAt: {
      type: Date,
      required: false,
    },
    cancellationReason: {
      type: String,
      required: false,
      trim: true,
    },
    cancelledAt: {
      type: Date,
      required: false,
    },
    startedAt: {
      type: Date,
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'reservations',
  }
);

// Add indexes
ReservationSchema.index({ reservationId: 1 });
ReservationSchema.index({ userId: 1 });
ReservationSchema.index({ quoteId: 1 });
ReservationSchema.index({ paymentId: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ reservationDate: 1 });
ReservationSchema.index({ createdAt: -1 });
ReservationSchema.index({ userId: 1, status: 1 });
ReservationSchema.index({ userId: 1, createdAt: -1 }); // For user's reservation list queries
ReservationSchema.index({ status: 1, assignedDriverId: 1 }); // For driver availability queries

