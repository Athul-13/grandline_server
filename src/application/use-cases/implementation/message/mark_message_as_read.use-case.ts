import { injectable, inject } from 'tsyringe';
import { IMarkMessageAsReadUseCase } from '../../interface/message/mark_message_as_read_use_case.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { IMessageRepository } from '../../../../domain/repositories/message_repository.interface';
import { MarkMessageAsReadRequest, MarkMessageAsReadResponse } from '../../../dtos/message.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for marking messages as read
 * Marks all unread messages in a chat as read for a user
 */
@injectable()
export class MarkMessageAsReadUseCase implements IMarkMessageAsReadUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository,
    @inject(REPOSITORY_TOKENS.IMessageRepository)
    private readonly messageRepository: IMessageRepository
  ) {}

  async execute(request: MarkMessageAsReadRequest, userId: string): Promise<MarkMessageAsReadResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    if (!request || !request.chatId) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Verify chat exists and user has access
    const chat = await this.chatRepository.findById(request.chatId);

    if (!chat) {
      logger.warn(`Attempt to mark messages as read in non-existent chat: ${request.chatId}`);
      throw new AppError('Chat not found', 'CHAT_NOT_FOUND', 404);
    }

    if (!chat.hasParticipant(userId)) {
      logger.warn(`User ${userId} attempted to mark messages as read in chat ${request.chatId} without permission`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Mark all unread messages in chat as read
    await this.messageRepository.markChatAsRead(request.chatId, userId);

    // Get updated unread count (should be 0 now)
    const unreadCount = await this.messageRepository.getUnreadCount(request.chatId, userId);

    logger.info(`Messages marked as read in chat: ${request.chatId} by user: ${userId}`);

    return {
      message: 'Messages marked as read',
      unreadCount,
    };
  }
}

