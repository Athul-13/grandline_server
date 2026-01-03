import { Schema } from 'mongoose';
import { ActorType } from '../../../../shared/constants';

/**
 * MongoDB schema for TicketMessage collection
 */
export const TicketMessageSchema: Schema = new Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ticketId: {
      type: String,
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: Object.values(ActorType),
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
      maxlength: 10000,
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
    collection: 'ticket_messages',
  }
);

// Primary lookup
TicketMessageSchema.index({ messageId: 1 });

// Ticket-based queries (most common)
TicketMessageSchema.index({ ticketId: 1, createdAt: 1 });
TicketMessageSchema.index({ ticketId: 1, createdAt: -1 });
TicketMessageSchema.index({ ticketId: 1, isDeleted: 1, createdAt: 1 });

// Sender queries
TicketMessageSchema.index({ senderType: 1, senderId: 1 });
TicketMessageSchema.index({ senderType: 1, senderId: 1, createdAt: -1 });

// Pagination support
TicketMessageSchema.index({ ticketId: 1, messageId: 1 });

// Soft delete
TicketMessageSchema.index({ isDeleted: 1 });