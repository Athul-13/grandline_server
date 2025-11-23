import { MessageDeliveryStatus } from '../../shared/constants';

/**
 * Message domain entity representing a message in a chat conversation
 * Contains core business logic and validation rules
 */
export class Message {
  constructor(
    public readonly messageId: string,
    public readonly chatId: string,
    public readonly senderId: string,
    public readonly content: string,
    public readonly deliveryStatus: MessageDeliveryStatus,
    public readonly createdAt: Date,
    public readonly readAt?: Date,
    public readonly readBy?: string
  ) {}

  /**
   * Checks if the message has been delivered
   */
  isDelivered(): boolean {
    return (
      this.deliveryStatus === MessageDeliveryStatus.DELIVERED ||
      this.deliveryStatus === MessageDeliveryStatus.READ
    );
  }

  /**
   * Checks if the message has been read
   */
  isRead(): boolean {
    return this.deliveryStatus === MessageDeliveryStatus.READ && !!this.readAt;
  }

  /**
   * Checks if the message was read by a specific user
   */
  isReadBy(userId: string): boolean {
    return this.isRead() && this.readBy === userId;
  }

  /**
   * Creates a new message entity with delivered status
   */
  markAsDelivered(): Message {
    return new Message(
      this.messageId,
      this.chatId,
      this.senderId,
      this.content,
      MessageDeliveryStatus.DELIVERED,
      this.createdAt,
      this.readAt,
      this.readBy
    );
  }

  /**
   * Creates a new message entity with read status
   */
  markAsRead(userId: string): Message {
    return new Message(
      this.messageId,
      this.chatId,
      this.senderId,
      this.content,
      MessageDeliveryStatus.READ,
      this.createdAt,
      new Date(),
      userId
    );
  }
}

