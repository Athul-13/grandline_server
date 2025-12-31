import mongoose, { Document } from "mongoose";
import { ActorType, LinkedEntityType, TicketStatus } from "../../../../shared/constants";
import { TicketSchema } from "../schemas/ticket.schema";
import { IDatabaseModel } from "../../../../domain/services/mongodb_model.interface";
import { MongoDBModelImpl } from "../mongodb_model.impl";

/**
 * MongoDB model for Ticket collection
 * Represents the structure of a document in the tickets collection
 */
export interface ITicketModel extends Document {
  ticketId: string;
  actorType: ActorType;
  actorId: string;
  subject: string;
  linkedEntityType: LinkedEntityType | null;
  linkedEntityId: string | null;
  status: TicketStatus;
  priority: string;
  assignedAdminId: string | null;
  lastMessageAt: Date | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Ticket
 */
export const TicketDB = mongoose.model<ITicketModel>('Ticket', TicketSchema);

/**
 * Creates an IDatabaseModel instance for Ticket
 */
export function createTicketModel(): IDatabaseModel<ITicketModel> {
    return new MongoDBModelImpl<ITicketModel>(TicketDB);
}