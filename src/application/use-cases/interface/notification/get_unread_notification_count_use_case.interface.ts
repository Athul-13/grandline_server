import { UnreadNotificationCountResponse } from '../../../dtos/notification.dto';

/**
 * Use case interface for getting unread notification count
 */
export interface IGetUnreadNotificationCountUseCase {
  execute(userId: string): Promise<UnreadNotificationCountResponse>;
}

