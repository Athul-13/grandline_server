import { Schema } from 'mongoose';
import { ActorType, LinkedEntityType, TicketStatus } from '../../../../shared/constants';

/**
 * MongoDB schema for Ticket collection
 */
export const TicketSchema: Schema = new Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    actorType: {
      type: String,
      enum: Object.values(ActorType),
      required: true,
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    linkedEntityType: {
      type: String,
      enum: Object.values(LinkedEntityType),
      required: false,
      index: true,
    },
    linkedEntityId: {
      type: String,
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      required: true,
      index: true,
    },
    assignedAdminId: {
      type: String,
      required: false,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      required: false,
      index: true,
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
    collection: 'tickets',
  }
);

// Primary lookup
TicketSchema.index({ ticketId: 1 });

// Actor-based queries (most common for users/drivers)
TicketSchema.index({ actorType: 1, actorId: 1 });
TicketSchema.index({ actorType: 1, actorId: 1, status: 1 });
TicketSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });
TicketSchema.index({ actorType: 1, actorId: 1, isDeleted: 1 });

// Admin queries
TicketSchema.index({ status: 1 });
TicketSchema.index({ status: 1, priority: 1 });
TicketSchema.index({ assignedAdminId: 1, status: 1 });
TicketSchema.index({ assignedAdminId: 1, createdAt: -1 });

// Entity linking queries
TicketSchema.index({ linkedEntityType: 1, linkedEntityId: 1 });

// Dashboard and analytics
TicketSchema.index({ actorType: 1, status: 1 });
TicketSchema.index({ lastMessageAt: -1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ status: 1, lastMessageAt: -1 });
TicketSchema.index({ status: 1, priority: 1, lastMessageAt: -1 });

// Soft delete
TicketSchema.index({ isDeleted: 1 });