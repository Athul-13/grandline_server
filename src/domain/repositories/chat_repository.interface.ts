import { ParticipantType } from '../../shared/constants';
import { Chat } from '../entities/chat.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for Chat entity operations
 * Defines the contract for data access layer implementations
 */
export interface IChatRepository extends IBaseRepository<Chat> {
  /**
   * Finds a chat by context type and context ID
   */
  findByContext(contextType: string, contextId: string): Promise<Chat | null>;

  /**
   * Finds all chats for a specific user
   */
  findByUserId(userId: string): Promise<Chat[]>;

  /**
   * Finds chats by participant type
   */
  findByParticipantType(participantType: ParticipantType): Promise<Chat[]>;

  /**
   * Finds chats for a user filtered by participant type
   */
  findByUserIdAndParticipantType(
    userId: string,
    participantType: ParticipantType
  ): Promise<Chat[]>;

  /**
   * Checks if a chat exists for the given context
   */
  existsByContext(contextType: string, contextId: string): Promise<boolean>;
}

