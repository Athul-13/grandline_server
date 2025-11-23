import { Router } from 'express';
import { container } from 'tsyringe';
import { MessageController } from '../../controllers/message/message.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { SendMessageRequest } from '../../../application/dtos/message.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures message routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createMessageRoutesWithDI(): Router {
  const router = Router();
  const messageController = container.resolve<MessageController>(CONTROLLER_TOKENS.MessageController);

  /**
   * @route   POST /api/v1/messages
   * @desc    Send a message in a chat
   * @access  Private
   */
  router.post(
    '/',
    authenticate,
    validationMiddleware(SendMessageRequest),
    (req, res) => void messageController.sendMessage(req, res)
  );

  /**
   * @route   GET /api/v1/messages/chat/:chatId
   * @desc    Get messages for a specific chat with pagination
   * @access  Private
   */
  router.get('/chat/:chatId', authenticate, (req, res) => void messageController.getChatMessages(req, res));

  /**
   * @route   POST /api/v1/messages/chat/:chatId/mark-read
   * @desc    Mark all messages in a chat as read
   * @access  Private
   */
  router.post(
    '/chat/:chatId/mark-read',
    authenticate,
    (req, res) => void messageController.markMessageAsRead(req, res)
  );

  /**
   * @route   GET /api/v1/messages/chat/:chatId/unread-count
   * @desc    Get unread message count for a specific chat
   * @access  Private
   */
  router.get(
    '/chat/:chatId/unread-count',
    authenticate,
    (req, res) => void messageController.getUnreadMessageCount(req, res)
  );

  /**
   * @route   GET /api/v1/messages/unread-count
   * @desc    Get total unread message count across all chats
   * @access  Private
   */
  router.get('/unread-count', authenticate, (req, res) => void messageController.getTotalUnreadMessageCount(req, res));

  return router;
}

