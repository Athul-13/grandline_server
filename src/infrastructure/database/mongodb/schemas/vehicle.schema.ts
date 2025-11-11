import { Schema } from 'mongoose';
import { VehicleStatus } from '../../../../shared/constants';

/**
 * MongoDB schema for Vehicle collection
 */
export const VehicleSchema: Schema = new Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vehicleTypeId: {
      type: String,
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },
    maintenance: {
      type: Number,
      required: true,
      min: 0,
    },
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    vehicleModel: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    fuelConsumption: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrls: {
      type: [String],
      required: false,
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      default: VehicleStatus.AVAILABLE,
      required: true,
      index: true,
    },
    amenityIds: {
      type: [String],
      required: false,
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'vehicles',
  }
);

// Add indexes
VehicleSchema.index({ vehicleId: 1 });
VehicleSchema.index({ vehicleTypeId: 1 });
VehicleSchema.index({ plateNumber: 1 });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ createdAt: -1 });