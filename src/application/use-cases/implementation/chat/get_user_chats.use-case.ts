import { injectable, inject } from 'tsyringe';
import { IGetUserChatsUseCase } from '../../interface/chat/get_user_chats_use_case.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { ChatListResponse } from '../../../dtos/chat.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting user chats
 * Retrieves all chats for a specific user
 */
@injectable()
export class GetUserChatsUseCase implements IGetUserChatsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository
  ) {}

  async execute(userId: string): Promise<ChatListResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    logger.info(`Fetching chats for user: ${userId}`);

    // Get all chats for the user
    const chats = await this.chatRepository.findByUserId(userId);

    // Convert to response format
    const chatResponses = chats.map((chat) => ({
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
    }));

    return {
      chats: chatResponses,
      total: chatResponses.length,
    };
  }
}

