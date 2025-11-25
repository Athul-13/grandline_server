import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { ICreateChatUseCase } from '../../../application/use-cases/interface/chat/create_chat_use_case.interface';
import { IGetUserChatsUseCase } from '../../../application/use-cases/interface/chat/get_user_chats_use_case.interface';
import { IGetChatByContextUseCase } from '../../../application/use-cases/interface/chat/get_chat_by_context_use_case.interface';
import { CreateChatRequest, ChatResponse } from '../../../application/dtos/chat.dto';
import { USE_CASE_TOKENS, SERVICE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';
import { ISocketEventService } from '../../../domain/services/socket_event_service.interface';
import { Chat } from '../../../domain/entities/chat.entity';

/**
 * Chat controller
 * Handles chat operations
 */
@injectable()
export class ChatController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateChatUseCase)
    private readonly createChatUseCase: ICreateChatUseCase,
    @inject(USE_CASE_TOKENS.GetUserChatsUseCase)
    private readonly getUserChatsUseCase: IGetUserChatsUseCase,
    @inject(USE_CASE_TOKENS.GetChatByContextUseCase)
    private readonly getChatByContextUseCase: IGetChatByContextUseCase,
    @inject(SERVICE_TOKENS.ISocketEventService)
    private readonly socketEventService: ISocketEventService
  ) {}

  /**
   * Handles creating a chat
   */
  async createChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Chat creation attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as CreateChatRequest;
      logger.info(`Chat creation request by user: ${req.user.userId}`);

      const response = await this.createChatUseCase.execute(request, req.user.userId);

      logger.info(`Chat created successfully: ${response.chatId}`);

      // Convert DTO to entity for domain service
      const chatEntity = this.chatResponseToEntity(response);
      
      // Emit socket events for real-time notifications
      void this.socketEventService.emitChatCreated(chatEntity, req.user.userId);

      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(`Error creating chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting user chats
   */
  async getUserChats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get chats attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Get chats request for user: ${req.user.userId}`);
      const response = await this.getUserChatsUseCase.execute(req.user.userId);

      logger.info(`Retrieved ${response.chats.length} chats for user: ${req.user.userId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting user chats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting chat by context
   */
  async getChatByContext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get chat by context attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const contextType = req.query.contextType as string;
      const contextId = req.query.contextId as string;

      if (!contextType || !contextId) {
        logger.warn('Get chat by context called without contextType or contextId');
        sendErrorResponse(res, new Error('contextType and contextId are required'));
        return;
      }

      logger.info(`Get chat by context request: ${contextType}/${contextId} by user: ${req.user.userId}`);
      const response = await this.getChatByContextUseCase.execute(contextType, contextId, req.user.userId);

      logger.info(`Chat retrieved for context: ${contextType}/${contextId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting chat by context: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Converts ChatResponse DTO to Chat entity
   * Used when passing data to domain services
   */
  private chatResponseToEntity(chatResponse: ChatResponse): Chat {
    return new Chat(
      chatResponse.chatId,
      chatResponse.contextType,
      chatResponse.contextId,
      chatResponse.participantType,
      chatResponse.participants,
      chatResponse.createdAt,
      chatResponse.updatedAt
    );
  }
}

