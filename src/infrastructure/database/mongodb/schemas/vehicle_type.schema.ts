import { Schema } from 'mongoose';

/**
 * MongoDB schema for VehicleType collection
 */
export const VehicleTypeSchema: Schema = new Schema(
  {
    vehicleTypeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      index: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'vehicle_types',
  }
);

// Add indexes
VehicleTypeSchema.index({ vehicleTypeId: 1 });
VehicleTypeSchema.index({ name: 1 });
VehicleTypeSchema.index({ createdAt: -1 });