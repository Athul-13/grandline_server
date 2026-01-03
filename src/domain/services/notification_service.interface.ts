import { NotificationType } from "../../shared/constants";

/**
 * Notification service interface
 * Defines the contract for notification service operations
 * Allows use cases to depend on abstraction instead of concrete implementation
 */
export interface INotificationService {
  sendNotification(notification: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void>;
}