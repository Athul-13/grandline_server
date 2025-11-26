import {
  MarkNotificationAsReadRequest,
  MarkNotificationAsReadResponse,
} from '../../../dtos/notification.dto';

/**
 * Use case interface for marking notification as read
 */
export interface IMarkNotificationAsReadUseCase {
  execute(request: MarkNotificationAsReadRequest, userId: string): Promise<MarkNotificationAsReadResponse>;
}

