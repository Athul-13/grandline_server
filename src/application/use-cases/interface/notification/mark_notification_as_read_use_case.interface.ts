import {
  MarkNotificationAsReadRequest,
  MarkNotificationAsReadResponse,
  MarkAllNotificationsAsReadResponse,
  UnreadNotificationCountResponse,
} from '../../../dtos/notification.dto';

/**
 * Use case interface for marking notification as read
 */
export interface IMarkNotificationAsReadUseCase {
  execute(request: MarkNotificationAsReadRequest, userId: string): Promise<MarkNotificationAsReadResponse>;
}

/**
 * Use case interface for marking all notifications as read
 */
export interface IMarkAllNotificationsAsReadUseCase {
  execute(userId: string): Promise<MarkAllNotificationsAsReadResponse>;
}

/**
 * Use case interface for getting unread notification count
 */
export interface IGetUnreadNotificationCountUseCase {
  execute(userId: string): Promise<UnreadNotificationCountResponse>;
}

