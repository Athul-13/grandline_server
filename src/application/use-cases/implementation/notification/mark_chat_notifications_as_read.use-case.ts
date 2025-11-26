import { injectable, inject } from 'tsyringe';
import { IMarkChatNotificationsAsReadUseCase } from '../../interface/notification/mark_chat_notifications_as_read_use_case.interface';
import { INotificationRepository } from '../../../../domain/repositories/notification_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for marking chat notifications as read
 */
@injectable()
export class MarkChatNotificationsAsReadUseCase implements IMarkChatNotificationsAsReadUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.INotificationRepository)
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(userId: string, chatId: string): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    if (!chatId || typeof chatId !== 'string' || chatId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CHAT_ID', 400);
    }

    // Mark all chat notifications as read for this user and chat
    await this.notificationRepository.markChatNotificationsAsRead(userId, chatId);

    logger.info(`Chat notifications marked as read for user: ${userId}, chat: ${chatId}`);
  }
}

