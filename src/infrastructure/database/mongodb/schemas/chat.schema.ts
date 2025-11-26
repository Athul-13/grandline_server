import { Schema } from 'mongoose';
import { ParticipantType } from '../../../../shared/constants';

/**
 * MongoDB schema for Chat collection
 */
export const ChatSchema: Schema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contextType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    contextId: {
      type: String,
      required: true,
      index: true,
    },
    participantType: {
      type: String,
      enum: Object.values(ParticipantType),
      required: true,
      index: true,
    },
    participants: {
      type: [
        {
          userId: { type: String, required: true },
          participantType: {
            type: String,
            enum: Object.values(ParticipantType),
            required: true,
          },
        },
      ],
      required: true,
      validate: {
        validator: (participants: Array<{ userId: string; participantType: ParticipantType }>) => {
          return participants.length === 2;
        },
        message: 'Chat must have exactly 2 participants',
      },
    },
  },
  {
    timestamps: true,
    collection: 'chats',
  }
);

// Add indexes
ChatSchema.index({ chatId: 1 });
ChatSchema.index({ contextType: 1, contextId: 1 }, { unique: true });
ChatSchema.index({ participantType: 1 });
ChatSchema.index({ 'participants.userId': 1 });
ChatSchema.index({ createdAt: -1 });
ChatSchema.index({ updatedAt: -1 });

