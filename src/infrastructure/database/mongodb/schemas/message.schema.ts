import { Schema } from 'mongoose';
import { MessageDeliveryStatus } from '../../../../shared/constants';

/**
 * MongoDB schema for Message collection
 */
export const MessageSchema: Schema = new Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    deliveryStatus: {
      type: String,
      enum: Object.values(MessageDeliveryStatus),
      default: MessageDeliveryStatus.SENT,
      required: true,
      index: true,
    },
    readAt: {
      type: Date,
      required: false,
    },
    readBy: {
      type: String,
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

// Add indexes
MessageSchema.index({ messageId: 1 });
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ deliveryStatus: 1 });
MessageSchema.index({ chatId: 1, readBy: 1, deliveryStatus: 1 });
MessageSchema.index({ createdAt: -1 });

