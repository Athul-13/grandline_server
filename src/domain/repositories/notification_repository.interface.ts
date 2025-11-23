import { NotificationType } from '../../shared/constants';
import { Notification } from '../entities/notification.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for Notification entity operations
 * Defines the contract for data access layer implementations
 */
export interface INotificationRepository extends IBaseRepository<Notification> {
  /**
   * Finds all notifications for a specific user
   */
  findByUserId(userId: string): Promise<Notification[]>;

  /**
   * Finds notifications for a user with pagination
   */
  findByUserIdPaginated(
    userId: string,
    page: number,
    limit: number
  ): Promise<Notification[]>;

  /**
   * Finds unread notifications for a user
   */
  findUnreadByUserId(userId: string): Promise<Notification[]>;

  /**
   * Gets the count of unread notifications for a user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Marks a notification as read
   */
  markAsRead(notificationId: string): Promise<void>;

  /**
   * Marks all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<void>;

  /**
   * Finds notifications by type for a user
   */
  findByUserIdAndType(
    userId: string,
    type: NotificationType
  ): Promise<Notification[]>;
}

