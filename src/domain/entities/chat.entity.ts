import { ParticipantType } from '../../shared/constants';

/**
 * Chat participant structure
 */
export interface IChatParticipant {
  userId: string;
  participantType: ParticipantType;
}

/**
 * Chat domain entity representing a chat conversation in the bus rental system
 * Contains core business logic and validation rules
 */
export class Chat {
  constructor(
    public readonly chatId: string,
    public readonly contextType: string,
    public readonly contextId: string,
    public readonly participantType: ParticipantType,
    public readonly participants: IChatParticipant[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Checks if a user is a participant in this chat
   */
  hasParticipant(userId: string): boolean {
    return this.participants.some((p) => p.userId === userId);
  }

  /**
   * Checks if a user can access this chat based on participant type
   */
  canAccess(userId: string, participantType: ParticipantType): boolean {
    if (!this.hasParticipant(userId)) {
      return false;
    }
    const participant = this.participants.find((p) => p.userId === userId);
    return participant?.participantType === participantType;
  }

  /**
   * Gets the other participant in the chat (for one-to-one chats)
   */
  getOtherParticipant(userId: string): IChatParticipant | null {
    const otherParticipant = this.participants.find((p) => p.userId !== userId);
    return otherParticipant || null;
  }

  /**
   * Checks if this is a quote-based chat
   */
  isQuoteChat(): boolean {
    return this.contextType === 'quote';
  }
}

