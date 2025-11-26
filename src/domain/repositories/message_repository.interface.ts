import { MessageDeliveryStatus } from '../../shared/constants';
import { Message } from '../entities/message.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for Message entity operations
 * Defines the contract for data access layer implementations
 */
export interface IMessageRepository extends IBaseRepository<Message> {
  /**
   * Finds all messages for a specific chat, ordered by creation date
   */
  findByChatId(chatId: string): Promise<Message[]>;

  /**
   * Finds messages for a chat with pagination
   */
  findByChatIdPaginated(
    chatId: string,
    page: number,
    limit: number
  ): Promise<Message[]>;

  /**
   * Marks a message as read
   */
  markAsRead(messageId: string, userId: string): Promise<void>;

  /**
   * Marks all unread messages in a chat as read for a specific user
   */
  markChatAsRead(chatId: string, userId: string): Promise<void>;

  /**
   * Gets the count of unread messages in a chat for a specific user
   */
  getUnreadCount(chatId: string, userId: string): Promise<number>;

  /**
   * Gets the count of unread messages across all chats for a user
   */
  getTotalUnreadCount(userId: string): Promise<number>;

  /**
   * Updates message delivery status
   */
  updateDeliveryStatus(
    messageId: string,
    status: MessageDeliveryStatus
  ): Promise<void>;

  /**
   * Finds the last message in a chat
   */
  findLastMessageByChatId(chatId: string): Promise<Message | null>;
}

