import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { ISendMessageUseCase } from '../../../application/use-cases/interface/message/send_message_use_case.interface';
import { IGetChatMessagesUseCase } from '../../../application/use-cases/interface/message/get_chat_messages_use_case.interface';
import { IMarkMessageAsReadUseCase } from '../../../application/use-cases/interface/message/mark_message_as_read_use_case.interface';
import { IGetUnreadMessageCountUseCase } from '../../../application/use-cases/interface/message/get_unread_message_count_use_case.interface';
import { IGetTotalUnreadMessageCountUseCase } from '../../../application/use-cases/interface/message/get_unread_message_count_use_case.interface';
import {
  SendMessageRequest,
  GetMessagesRequest,
  MarkMessageAsReadRequest,
} from '../../../application/dtos/message.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Message controller
 * Handles message operations
 */
@injectable()
export class MessageController {
  constructor(
    @inject(USE_CASE_TOKENS.SendMessageUseCase)
    private readonly sendMessageUseCase: ISendMessageUseCase,
    @inject(USE_CASE_TOKENS.GetChatMessagesUseCase)
    private readonly getChatMessagesUseCase: IGetChatMessagesUseCase,
    @inject(USE_CASE_TOKENS.MarkMessageAsReadUseCase)
    private readonly markMessageAsReadUseCase: IMarkMessageAsReadUseCase,
    @inject(USE_CASE_TOKENS.GetUnreadMessageCountUseCase)
    private readonly getUnreadMessageCountUseCase: IGetUnreadMessageCountUseCase,
    @inject(USE_CASE_TOKENS.GetTotalUnreadMessageCountUseCase)
    private readonly getTotalUnreadMessageCountUseCase: IGetTotalUnreadMessageCountUseCase
  ) {}

  /**
   * Handles sending a message
   */
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Send message attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as SendMessageRequest;
      logger.info(`Send message request in chat: ${request.chatId} by user: ${req.user.userId}`);

      const response = await this.sendMessageUseCase.execute(request, req.user.userId);

      logger.info(`Message sent successfully: ${response.messageId}`);
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(`Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting chat messages
   */
  async getChatMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get messages attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const chatId = req.params.chatId;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const request: GetMessagesRequest = {
        chatId,
        page,
        limit,
      };

      logger.info(`Get messages request for chat: ${chatId} by user: ${req.user.userId}`);
      const response = await this.getChatMessagesUseCase.execute(request, req.user.userId);

      logger.info(`Retrieved ${response.messages.length} messages for chat: ${chatId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles marking messages as read
   */
  async markMessageAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Mark message as read attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request: MarkMessageAsReadRequest = {
        chatId: req.params.chatId,
      };

      logger.info(`Mark messages as read request for chat: ${request.chatId} by user: ${req.user.userId}`);
      const response = await this.markMessageAsReadUseCase.execute(request, req.user.userId);

      logger.info(`Messages marked as read for chat: ${request.chatId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error marking messages as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting unread message count for a specific chat
   */
  async getUnreadMessageCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get unread message count attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const chatId = req.params.chatId;

      logger.info(`Get unread message count request for chat: ${chatId} by user: ${req.user.userId}`);
      const response = await this.getUnreadMessageCountUseCase.execute(chatId, req.user.userId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error getting unread message count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting total unread message count across all chats
   */
  async getTotalUnreadMessageCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get total unread message count attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Get total unread message count request for user: ${req.user.userId}`);
      const response = await this.getTotalUnreadMessageCountUseCase.execute(req.user.userId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error getting total unread message count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

