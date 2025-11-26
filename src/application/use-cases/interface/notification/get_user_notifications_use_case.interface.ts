import { GetNotificationsRequest, NotificationListResponse } from '../../../dtos/notification.dto';

/**
 * Use case interface for getting user notifications
 */
export interface IGetUserNotificationsUseCase {
  execute(userId: string, request: GetNotificationsRequest): Promise<NotificationListResponse>;
}

