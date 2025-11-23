import { injectable, inject } from 'tsyringe';
import { IGetChatMessagesUseCase } from '../../interface/message/get_chat_messages_use_case.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { IMessageRepository } from '../../../../domain/repositories/message_repository.interface';
import { GetMessagesRequest, MessageListResponse } from '../../../dtos/message.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting chat messages
 * Retrieves messages for a chat with pagination
 */
@injectable()
export class GetChatMessagesUseCase implements IGetChatMessagesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository,
    @inject(REPOSITORY_TOKENS.IMessageRepository)
    private readonly messageRepository: IMessageRepository
  ) {}

  async execute(request: GetMessagesRequest, userId: string): Promise<MessageListResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    if (!request || !request.chatId) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    const page = request.page || 1;
    const limit = request.limit || 50;

    // Verify chat exists and user has access
    const chat = await this.chatRepository.findById(request.chatId);

    if (!chat) {
      logger.warn(`Attempt to get messages from non-existent chat: ${request.chatId}`);
      throw new AppError('Chat not found', 'CHAT_NOT_FOUND', 404);
    }

    if (!chat.hasParticipant(userId)) {
      logger.warn(`User ${userId} attempted to get messages from chat ${request.chatId} without permission`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Get messages
    const messages = await this.messageRepository.findByChatIdPaginated(request.chatId, page, limit);
    const allMessages = await this.messageRepository.findByChatId(request.chatId);

    // Convert to response format
    const messageResponses = messages.map((message) => ({
      messageId: message.messageId,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      deliveryStatus: message.deliveryStatus,
      createdAt: message.createdAt,
      readAt: message.readAt,
      readBy: message.readBy,
    }));

    return {
      messages: messageResponses,
      total: allMessages.length,
      page,
      limit,
      hasMore: page * limit < allMessages.length,
    };
  }
}

