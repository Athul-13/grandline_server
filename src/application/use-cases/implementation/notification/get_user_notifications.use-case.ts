import { injectable, inject } from 'tsyringe';
import { IGetUserNotificationsUseCase } from '../../interface/notification/get_user_notifications_use_case.interface';
import { INotificationRepository } from '../../../../domain/repositories/notification_repository.interface';
import { GetNotificationsRequest, NotificationListResponse } from '../../../dtos/notification.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting user notifications
 * Retrieves notifications for a user with pagination and filtering
 */
@injectable()
export class GetUserNotificationsUseCase implements IGetUserNotificationsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.INotificationRepository)
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(userId: string, request: GetNotificationsRequest): Promise<NotificationListResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    const page = request.page || 1;
    const limit = request.limit || 50;

    logger.info(`Fetching notifications for user: ${userId}, page: ${page}, limit: ${limit}`);

    let notifications;

    // Filter by type if specified
    if (request.type) {
      notifications = await this.notificationRepository.findByUserIdAndType(userId, request.type);
    } else if (request.unreadOnly) {
      notifications = await this.notificationRepository.findUnreadByUserId(userId);
    } else {
      notifications = await this.notificationRepository.findByUserId(userId);
    }

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedNotifications = notifications.slice(skip, skip + limit);

    // Get unread count
    const unreadCount = await this.notificationRepository.getUnreadCount(userId);

    // Convert to response format
    const notificationResponses = paginatedNotifications.map((notification) => ({
      notificationId: notification.notificationId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    }));

    return {
      notifications: notificationResponses,
      total: notifications.length,
      page,
      limit,
      hasMore: page * limit < notifications.length,
      unreadCount,
    };
  }
}

