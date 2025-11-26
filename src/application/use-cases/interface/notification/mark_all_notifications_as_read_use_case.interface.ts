import { MarkAllNotificationsAsReadResponse } from '../../../dtos/notification.dto';

/**
 * Use case interface for marking all notifications as read
 */
export interface IMarkAllNotificationsAsReadUseCase {
  execute(userId: string): Promise<MarkAllNotificationsAsReadResponse>;
}

