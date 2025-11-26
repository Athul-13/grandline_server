import { injectable, inject } from 'tsyringe';
import { IMarkAllNotificationsAsReadUseCase } from '../../interface/notification/mark_all_notifications_as_read_use_case.interface';
import { INotificationRepository } from '../../../../domain/repositories/notification_repository.interface';
import { MarkAllNotificationsAsReadResponse } from '../../../dtos/notification.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for marking all notifications as read
 */
@injectable()
export class MarkAllNotificationsAsReadUseCase implements IMarkAllNotificationsAsReadUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.INotificationRepository)
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(userId: string): Promise<MarkAllNotificationsAsReadResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    // Get unread count before marking
    const unreadNotifications = await this.notificationRepository.findUnreadByUserId(userId);
    const markedCount = unreadNotifications.length;

    // Mark all as read
    await this.notificationRepository.markAllAsRead(userId);

    logger.info(`All notifications marked as read for user: ${userId}, count: ${markedCount}`);

    return {
      message: 'All notifications marked as read',
      markedCount,
    };
  }
}

