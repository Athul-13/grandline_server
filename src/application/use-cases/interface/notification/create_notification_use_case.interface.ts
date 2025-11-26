import { CreateNotificationRequest, NotificationResponse } from '../../../dtos/notification.dto';

/**
 * Use case interface for creating a notification
 */
export interface ICreateNotificationUseCase {
  execute(request: CreateNotificationRequest): Promise<NotificationResponse>;
}

