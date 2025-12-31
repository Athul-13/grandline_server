import { Schema } from 'mongoose';
import { DriverStatus } from '../../../../shared/constants';

/**
 * MongoDB schema for Driver collection
 */
export const DriverSchema: Schema = new Schema(
  {
    driverId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't return password by default
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    profilePictureUrl: {
      type: String,
      default: '',
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    licenseCardPhotoUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(DriverStatus),
      default: DriverStatus.AVAILABLE,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    lastAssignedAt: {
      type: Date,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'drivers',
  }
);

DriverSchema.index({ email: 1 });
DriverSchema.index({ driverId: 1 });
DriverSchema.index({ licenseNumber: 1 });
DriverSchema.index({ createdAt: -1 });
DriverSchema.index({ lastAssignedAt: 1 }); // For fair assignment sorting

