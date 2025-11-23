import { Router } from 'express';
import { container } from 'tsyringe';
import { ChatController } from '../../controllers/chat/chat.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { CreateChatRequest } from '../../../application/dtos/chat.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures chat routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createChatRoutesWithDI(): Router {
  const router = Router();
  const chatController = container.resolve<ChatController>(CONTROLLER_TOKENS.ChatController);

  /**
   * @route   POST /api/v1/chats
   * @desc    Create a new chat
   * @access  Private
   */
  router.post(
    '/',
    authenticate,
    validationMiddleware(CreateChatRequest),
    (req, res) => void chatController.createChat(req, res)
  );

  /**
   * @route   GET /api/v1/chats
   * @desc    Get all chats for the authenticated user
   * @access  Private
   */
  router.get('/', authenticate, (req, res) => void chatController.getUserChats(req, res));

  /**
   * @route   GET /api/v1/chats/by-context
   * @desc    Get chat by context (contextType and contextId)
   * @access  Private
   */
  router.get('/by-context', authenticate, (req, res) => void chatController.getChatByContext(req, res));

  return router;
}

