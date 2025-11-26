import { Router } from 'express';
import { container } from 'tsyringe';
import { NotificationController } from '../../controllers/notification/notification.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { CreateNotificationRequest } from '../../../application/dtos/notification.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures notification routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createNotificationRoutesWithDI(): Router {
  const router = Router();
  const notificationController = container.resolve<NotificationController>(
    CONTROLLER_TOKENS.NotificationController
  );

  /**
   * @route   POST /api/v1/notifications
   * @desc    Create a notification (typically used by system/admin)
   * @access  Private (may need admin role in future)
   */
  router.post(
    '/',
    authenticate,
    validationMiddleware(CreateNotificationRequest),
    (req, res) => void notificationController.createNotification(req, res)
  );

  /**
   * @route   GET /api/v1/notifications
   * @desc    Get all notifications for the authenticated user with pagination
   * @access  Private
   */
  router.get('/', authenticate, (req, res) => void notificationController.getUserNotifications(req, res));

  /**
   * @route   POST /api/v1/notifications/:notificationId/mark-read
   * @desc    Mark a specific notification as read
   * @access  Private
   */
  router.post(
    '/:notificationId/mark-read',
    authenticate,
    (req, res) => void notificationController.markNotificationAsRead(req, res)
  );

  /**
   * @route   POST /api/v1/notifications/mark-all-read
   * @desc    Mark all notifications as read for the authenticated user
   * @access  Private
   */
  router.post('/mark-all-read', authenticate, (req, res) => void notificationController.markAllNotificationsAsRead(req, res));

  /**
   * @route   GET /api/v1/notifications/unread-count
   * @desc    Get unread notification count for the authenticated user
   * @access  Private
   */
  router.get('/unread-count', authenticate, (req, res) => void notificationController.getUnreadNotificationCount(req, res));

  return router;
}

