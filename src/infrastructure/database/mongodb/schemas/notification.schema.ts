import { Schema } from 'mongoose';
import { NotificationType } from '../../../../shared/constants';

/**
 * MongoDB schema for Notification collection
 */
export const NotificationSchema: Schema = new Schema(
  {
    notificationId: {
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
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Add indexes
NotificationSchema.index({ notificationId: 1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });

