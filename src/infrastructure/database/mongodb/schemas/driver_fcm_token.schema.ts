import { Schema } from 'mongoose';

/**
 * MongoDB schema for DriverFcmToken collection
 */
export const DriverFcmTokenSchema: Schema = new Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    driverId: {
      type: String,
      required: true,
      index: true,
    },
    fcmToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: false,
    },
    platform: {
      type: String,
      required: true,
      enum: ['ios', 'android'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for driverId and platform
DriverFcmTokenSchema.index({ driverId: 1, platform: 1 });

