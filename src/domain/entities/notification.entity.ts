import { NotificationType } from '../../shared/constants';

/**
 * Notification domain entity representing a notification in the system
 * Contains core business logic and validation rules
 */
export class Notification {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly isRead: boolean,
    public readonly createdAt: Date,
    public readonly data?: Record<string, unknown>
  ) {}

  /**
   * Checks if the notification has been read
   */
  isUnread(): boolean {
    return !this.isRead;
  }

  /**
   * Creates a new notification entity with read status
   */
  markAsRead(): Notification {
    return new Notification(
      this.notificationId,
      this.userId,
      this.type,
      this.title,
      this.message,
      true,
      this.createdAt,
      this.data
    );
  }

  /**
   * Checks if this is a chat-related notification
   */
  isChatNotification(): boolean {
    return this.type === NotificationType.CHAT_MESSAGE;
  }
}

