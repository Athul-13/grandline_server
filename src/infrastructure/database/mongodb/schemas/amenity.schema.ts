import { Schema } from 'mongoose';

/**
 * MongoDB schema for Amenity collection
 */
export const AmenitySchema: Schema = new Schema(
  {
    amenityId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      index: true,
    },
    price: {
      type: Number,
      required: false,
      min: 0,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'amenities',
  }
);

// Add indexes
AmenitySchema.index({ amenityId: 1 });
AmenitySchema.index({ name: 1 });
AmenitySchema.index({ price: 1 });
AmenitySchema.index({ createdAt: -1 });

