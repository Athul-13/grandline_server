import { injectable, inject } from 'tsyringe';
import { IGetChatByContextUseCase } from '../../interface/chat/get_chat_by_context_use_case.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { GetChatByContextResponse } from '../../../dtos/chat.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting chat by context
 * Retrieves a chat for a specific context (e.g., quote)
 */
@injectable()
export class GetChatByContextUseCase implements IGetChatByContextUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository
  ) {}

  async execute(
    contextType: string,
    contextId: string,
    userId: string
  ): Promise<GetChatByContextResponse> {
    // Input validation
    if (!contextType || typeof contextType !== 'string' || contextType.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CONTEXT_TYPE', 400);
    }

    if (!contextId || typeof contextId !== 'string' || contextId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CONTEXT_ID', 400);
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    logger.info(`Fetching chat for context: ${contextType}:${contextId} by user: ${userId}`);

    // Find chat by context
    const chat = await this.chatRepository.findByContext(contextType, contextId);

    if (!chat) {
      return { chat: null };
    }

    // Verify user has access to the chat
    if (!chat.hasParticipant(userId)) {
      logger.warn(
        `User ${userId} attempted to access chat ${chat.chatId} without permission`
      );
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Convert to response format
    const chatResponse = {
      chatId: chat.chatId,
      contextType: chat.contextType,
      contextId: chat.contextId,
      participantType: chat.participantType,
      participants: chat.participants.map((p) => ({
        userId: p.userId,
        participantType: p.participantType,
      })),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };

    return { chat: chatResponse };
  }
}

