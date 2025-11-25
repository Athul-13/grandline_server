import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { ICreateNotificationUseCase } from '../../../application/use-cases/interface/notification/create_notification_use_case.interface';
import { IGetUserNotificationsUseCase } from '../../../application/use-cases/interface/notification/get_user_notifications_use_case.interface';
import { IMarkNotificationAsReadUseCase } from '../../../application/use-cases/interface/notification/mark_notification_as_read_use_case.interface';
import { IMarkAllNotificationsAsReadUseCase } from '../../../application/use-cases/interface/notification/mark_all_notifications_as_read_use_case.interface';
import { IGetUnreadNotificationCountUseCase } from '../../../application/use-cases/interface/notification/get_unread_notification_count_use_case.interface';
import {
  CreateNotificationRequest,
  GetNotificationsRequest,
  MarkNotificationAsReadRequest,
} from '../../../application/dtos/notification.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Notification controller
 * Handles notification operations
 */
@injectable()
export class NotificationController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase,
    @inject(USE_CASE_TOKENS.GetUserNotificationsUseCase)
    private readonly getUserNotificationsUseCase: IGetUserNotificationsUseCase,
    @inject(USE_CASE_TOKENS.MarkNotificationAsReadUseCase)
    private readonly markNotificationAsReadUseCase: IMarkNotificationAsReadUseCase,
    @inject(USE_CASE_TOKENS.MarkAllNotificationsAsReadUseCase)
    private readonly markAllNotificationsAsReadUseCase: IMarkAllNotificationsAsReadUseCase,
    @inject(USE_CASE_TOKENS.GetUnreadNotificationCountUseCase)
    private readonly getUnreadNotificationCountUseCase: IGetUnreadNotificationCountUseCase
  ) {}

  /**
   * Handles creating a notification
   */
  async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request = req.body as CreateNotificationRequest;
      logger.info(`Create notification request for user: ${request.userId}`);

      const response = await this.createNotificationUseCase.execute(request);

      logger.info(`Notification created successfully: ${response.notificationId}`);
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(`Error creating notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting user notifications
   */
  async getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get notifications attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const unreadOnly = req.query.unreadOnly === 'true';
      const type = req.query.type as string | undefined;

      const request: GetNotificationsRequest = {
        page,
        limit,
        unreadOnly,
        type: type as any,
      };

      logger.info(`Get notifications request for user: ${req.user.userId}`);
      const response = await this.getUserNotificationsUseCase.execute(req.user.userId, request);

      logger.info(`Retrieved ${response.notifications.length} notifications for user: ${req.user.userId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting user notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles marking a notification as read
   */
  async markNotificationAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Mark notification as read attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request: MarkNotificationAsReadRequest = {
        notificationId: req.params.notificationId,
      };

      logger.info(`Mark notification as read request: ${request.notificationId} by user: ${req.user.userId}`);
      const response = await this.markNotificationAsReadUseCase.execute(request, req.user.userId);

      logger.info(`Notification marked as read: ${request.notificationId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error marking notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles marking all notifications as read
   */
  async markAllNotificationsAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Mark all notifications as read attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Mark all notifications as read request for user: ${req.user.userId}`);
      const response = await this.markAllNotificationsAsReadUseCase.execute(req.user.userId);

      logger.info(`All notifications marked as read for user: ${req.user.userId}, count: ${response.markedCount}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error marking all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting unread notification count
   */
  async getUnreadNotificationCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get unread notification count attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Get unread notification count request for user: ${req.user.userId}`);
      const response = await this.getUnreadNotificationCountUseCase.execute(req.user.userId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error getting unread notification count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

