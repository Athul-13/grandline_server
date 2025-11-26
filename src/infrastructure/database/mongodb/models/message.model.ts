import mongoose, { Document } from 'mongoose';
import { MessageDeliveryStatus } from '../../../../shared/constants';
import { MessageSchema } from '../schemas/message.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for Message
 * Represents the structure of a document in the messages collection
 */
export interface IMessageModel extends Document {
  messageId: string;
  chatId: string;
  senderId: string;
  content: string;
  deliveryStatus: MessageDeliveryStatus;
  readAt?: Date;
  readBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Message
 */
export const MessageDB = mongoose.model<IMessageModel>('Message', MessageSchema);

/**
 * Creates an IDatabaseModel instance for Message
 */
export function createMessageModel(): IDatabaseModel<IMessageModel> {
  return new MongoDBModelImpl<IMessageModel>(MessageDB);
}

