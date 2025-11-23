import { Schema } from 'mongoose';

/**
 * MongoDB schema for EventType collection
 */
export const EventTypeSchema: Schema = new Schema(
  {
    eventTypeId: {
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
    isCustom: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'event_types',
  }
);

// Add indexes
EventTypeSchema.index({ eventTypeId: 1 });
EventTypeSchema.index({ name: 1 });
EventTypeSchema.index({ isCustom: 1 });
EventTypeSchema.index({ isActive: 1 });
EventTypeSchema.index({ createdAt: -1 });

