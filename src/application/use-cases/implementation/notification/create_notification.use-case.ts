import { injectable, inject } from 'tsyringe';
import { ICreateNotificationUseCase } from '../../interface/notification/create_notification_use_case.interface';
import { INotificationRepository } from '../../../../domain/repositories/notification_repository.interface';
import { CreateNotificationRequest, NotificationResponse } from '../../../dtos/notification.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { Notification } from '../../../../domain/entities/notification.entity';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for creating a notification
 * Creates and stores a notification in the database
 */
@injectable()
export class CreateNotificationUseCase implements ICreateNotificationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.INotificationRepository)
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(request: CreateNotificationRequest): Promise<NotificationResponse> {
    // Input validation
    if (!request || !request.userId || !request.type || !request.title || !request.message) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Create notification entity
    const notificationId = randomUUID();
    const now = new Date();

    const notification = new Notification(
      notificationId,
      request.userId,
      request.type,
      request.title,
      request.message,
      false, // isRead - default to unread
      now,
      request.data
    );

    await this.notificationRepository.create(notification);

    logger.info(`Notification created: ${notificationId} for user: ${request.userId}`);

    // Convert to response
    return {
      notificationId: notification.notificationId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}

