import mongoose, { Document } from "mongoose";
import { ActorType } from "../../../../shared/constants";
import { MongoDBModelImpl } from "../mongodb_model.impl";
import { IDatabaseModel } from "../../../../domain/services/mongodb_model.interface";
import { TicketMessageSchema } from "../schemas/ticket_message.schema";

/**
 * MongoDB document type for TicketMessage
 * Represents the structure of a document in the ticket_messages collection
 */
export interface ITicketMessageModel extends Document {
  messageId: string;
  ticketId: string;
  senderType: ActorType;
  senderId: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for TicketMessage
 */
export const TicketMessageDB = mongoose.model<ITicketMessageModel>('TicketMessage', TicketMessageSchema);

/**
 * Creates an IDatabaseModel instance for TicketMessage
 */
export function createTicketMessageModel(): IDatabaseModel<ITicketMessageModel> {
    return new MongoDBModelImpl<ITicketMessageModel>(TicketMessageDB);
}