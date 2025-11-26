import { injectable, inject } from 'tsyringe';
import { IMarkNotificationAsReadUseCase } from '../../interface/notification/mark_notification_as_read_use_case.interface';
import { INotificationRepository } from '../../../../domain/repositories/notification_repository.interface';
import {
  MarkNotificationAsReadRequest,
  MarkNotificationAsReadResponse,
} from '../../../dtos/notification.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for marking a notification as read
 */
@injectable()
export class MarkNotificationAsReadUseCase implements IMarkNotificationAsReadUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.INotificationRepository)
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(
    request: MarkNotificationAsReadRequest,
    userId: string
  ): Promise<MarkNotificationAsReadResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    if (!request || !request.notificationId) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Get notification to verify ownership
    const notification = await this.notificationRepository.findById(request.notificationId);

    if (!notification) {
      logger.warn(`Attempt to mark non-existent notification as read: ${request.notificationId}`);
      throw new AppError('Notification not found', 'NOTIFICATION_NOT_FOUND', 404);
    }

    if (notification.userId !== userId) {
      logger.warn(
        `User ${userId} attempted to mark notification ${request.notificationId} owned by ${notification.userId} as read`
      );
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Mark as read
    await this.notificationRepository.markAsRead(request.notificationId);

    // Get updated notification
    const updatedNotification = await this.notificationRepository.findById(request.notificationId);

    if (!updatedNotification) {
      throw new AppError('Notification not found after update', 'NOTIFICATION_NOT_FOUND', 404);
    }

    logger.info(`Notification marked as read: ${request.notificationId} by user: ${userId}`);

    return {
      message: 'Notification marked as read',
      notification: {
        notificationId: updatedNotification.notificationId,
        userId: updatedNotification.userId,
        type: updatedNotification.type,
        title: updatedNotification.title,
        message: updatedNotification.message,
        data: updatedNotification.data,
        isRead: updatedNotification.isRead,
        createdAt: updatedNotification.createdAt,
      },
    };
  }
}

