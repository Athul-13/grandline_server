import { Schema } from 'mongoose';

/**
 * MongoDB schema for PricingConfig collection
 */
export const PricingConfigSchema: Schema = new Schema(
  {
    pricingConfigId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      index: true,
    },
    fuelPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    averageDriverPerHourRate: {
      type: Number,
      required: true,
      min: 0,
    },
    stayingChargePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    nightChargePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'pricing_config',
  }
);

// Add indexes
PricingConfigSchema.index({ pricingConfigId: 1 });
PricingConfigSchema.index({ version: -1 });
PricingConfigSchema.index({ isActive: 1 });
PricingConfigSchema.index({ createdAt: -1 });
PricingConfigSchema.index({ isActive: 1, version: -1 });

