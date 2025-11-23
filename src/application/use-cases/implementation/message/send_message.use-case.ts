import { injectable, inject } from 'tsyringe';
import { ISendMessageUseCase } from '../../interface/message/send_message_use_case.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { IMessageRepository } from '../../../../domain/repositories/message_repository.interface';
import { SendMessageRequest, MessageResponse } from '../../../dtos/message.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { Message } from '../../../../domain/entities/message.entity';
import { MessageDeliveryStatus, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for sending a message
 * Creates message and chat if needed, handles message delivery
 */
@injectable()
export class SendMessageUseCase implements ISendMessageUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository,
    @inject(REPOSITORY_TOKENS.IMessageRepository)
    private readonly messageRepository: IMessageRepository
  ) {}

  async execute(request: SendMessageRequest, senderId: string): Promise<MessageResponse> {
    // Input validation
    if (!senderId || typeof senderId !== 'string' || senderId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_SENDER_ID', 400);
    }

    if (!request || !request.chatId || !request.content) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Check if chat exists
    let chat = await this.chatRepository.findById(request.chatId);

    // If chat doesn't exist, we need context info to create it
    // For now, we'll require chat to exist (it should be created when first message is sent via socket)
    if (!chat) {
      logger.warn(`Attempt to send message to non-existent chat: ${request.chatId}`);
      throw new AppError('Chat not found', 'CHAT_NOT_FOUND', 404);
    }

    // Verify sender is a participant
    if (!chat.hasParticipant(senderId)) {
      logger.warn(`User ${senderId} attempted to send message to chat ${request.chatId} without permission`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Create message entity
    const messageId = randomUUID();
    const now = new Date();

    const message = new Message(
      messageId,
      request.chatId,
      senderId,
      request.content,
      MessageDeliveryStatus.SENT,
      now
    );

    await this.messageRepository.create(message);

    logger.info(`Message sent: ${messageId} in chat: ${request.chatId} by user: ${senderId}`);

    // Convert to response
    return {
      messageId: message.messageId,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      deliveryStatus: message.deliveryStatus,
      createdAt: message.createdAt,
      readAt: message.readAt,
      readBy: message.readBy,
    };
  }
}

