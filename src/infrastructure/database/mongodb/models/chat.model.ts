import mongoose, { Document } from 'mongoose';
import { ParticipantType } from '../../../../shared/constants';
import { ChatSchema } from '../schemas/chat.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * Chat participant structure
 */
export interface IChatParticipantModel {
  userId: string;
  participantType: ParticipantType;
}

/**
 * MongoDB document type for Chat
 * Represents the structure of a document in the chats collection
 */
export interface IChatModel extends Document {
  chatId: string;
  contextType: string;
  contextId: string;
  participantType: ParticipantType;
  participants: IChatParticipantModel[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Chat
 */
export const ChatDB = mongoose.model<IChatModel>('Chat', ChatSchema);

/**
 * Creates an IDatabaseModel instance for Chat
 */
export function createChatModel(): IDatabaseModel<IChatModel> {
  return new MongoDBModelImpl<IChatModel>(ChatDB);
}

