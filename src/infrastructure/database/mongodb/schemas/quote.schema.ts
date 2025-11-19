import { Schema } from 'mongoose';
import { QuoteStatus, TripType } from '../../../../shared/constants';

/**
 * MongoDB schema for Quote collection
 */
export const QuoteSchema: Schema = new Schema(
  {
    quoteId: {
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
      enum: Object.values(QuoteStatus),
      default: QuoteStatus.DRAFT,
      required: true,
      index: true,
    },
    currentStep: {
      type: Number,
      required: false,
      min: 1,
      max: 5,
      default: 1,
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
    pricing: {
      fuelPriceAtTime: { type: Number, required: false },
      averageDriverRateAtTime: { type: Number, required: false },
      taxPercentageAtTime: { type: Number, required: false },
      baseFare: { type: Number, required: false },
      distanceFare: { type: Number, required: false },
      driverCharge: { type: Number, required: false },
      fuelMaintenance: { type: Number, required: false },
      nightCharge: { type: Number, required: false },
      stayingCharge: { type: Number, required: false },
      amenitiesTotal: { type: Number, required: false },
      subtotal: { type: Number, required: false },
      tax: { type: Number, required: false },
      total: { type: Number, required: false },
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
    actualDriverRate: {
      type: Number,
      required: false,
      min: 0,
    },
    pricingLastUpdatedAt: {
      type: Date,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'quotes',
  }
);

// Add indexes
QuoteSchema.index({ quoteId: 1 });
QuoteSchema.index({ userId: 1 });
QuoteSchema.index({ status: 1 });
QuoteSchema.index({ isDeleted: 1 });
QuoteSchema.index({ createdAt: -1 });
QuoteSchema.index({ userId: 1, status: 1 });
QuoteSchema.index({ userId: 1, isDeleted: 1 });

