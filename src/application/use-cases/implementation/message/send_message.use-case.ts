import { injectable, inject } from 'tsyringe';
import { ISendMessageUseCase } from '../../interface/message/send_message_use_case.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { IMessageRepository } from '../../../../domain/repositories/message_repository.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { SendMessageRequest, MessageResponse } from '../../../dtos/message.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { Message } from '../../../../domain/entities/message.entity';
import { Chat, IChatParticipant } from '../../../../domain/entities/chat.entity';
import { MessageDeliveryStatus, ERROR_MESSAGES, ERROR_CODES, ParticipantType, UserRole } from '../../../../shared/constants';
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
    private readonly messageRepository: IMessageRepository,
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: SendMessageRequest, senderId: string): Promise<MessageResponse> {
    // Input validation
    if (!senderId || typeof senderId !== 'string' || senderId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_SENDER_ID', 400);
    }

    if (!request || !request.content) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Validate that either chatId OR (contextType + contextId) is provided
    if (!request.chatId && (!request.contextType || !request.contextId)) {
      throw new AppError(
        'Either chatId or (contextType and contextId) must be provided',
        ERROR_CODES.INVALID_REQUEST,
        400
      );
    }

    let chatId: string;
    let chat: Chat | null = null;

    // If chatId is provided, use existing flow
    if (request.chatId) {
      chatId = request.chatId;
      chat = await this.chatRepository.findById(chatId);

      if (!chat) {
        logger.warn(`Attempt to send message to non-existent chat: ${chatId}`);
        throw new AppError('Chat not found', ERROR_CODES.CHAT_NOT_FOUND, 404);
      }

      // Verify sender is a participant
      if (!chat.hasParticipant(senderId)) {
        logger.warn(`User ${senderId} attempted to send message to chat ${chatId} without permission`);
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
      }
    } else {
      // Auto-create chat from context
      chatId = await this.autoCreateChat(request, senderId);
      chat = await this.chatRepository.findById(chatId);

      if (!chat) {
        logger.error(`Failed to create or retrieve chat after auto-creation: ${chatId}`);
        throw new AppError('Failed to create chat', ERROR_CODES.CHAT_NOT_FOUND, 500);
      }
    }

    // Create message entity
    const messageId = randomUUID();
    const now = new Date();

    const message = new Message(
      messageId,
      chatId,
      senderId,
      request.content,
      MessageDeliveryStatus.SENT,
      now
    );

    await this.messageRepository.create(message);

    logger.info(`Message sent: ${messageId} in chat: ${chatId} by user: ${senderId}`);

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

  /**
   * Auto-creates a chat from context information
   * Supports 'quote' contextType and 'admin'/'direct' contextType for direct admin messaging
   */
  private async autoCreateChat(request: SendMessageRequest, senderId: string): Promise<string> {
    // Type guard: ensure contextType and contextId are provided
    if (!request.contextType || !request.contextId) {
      throw new AppError(
        'contextType and contextId are required for auto-creating chat',
        ERROR_CODES.INVALID_REQUEST,
        400
      );
    }

    const contextType = request.contextType;
    const contextId = request.contextId;

    // Handle quote-based chat creation
    if (contextType === 'quote') {
      return await this.createQuoteBasedChat(contextId, senderId);
    }

    // Handle direct admin messaging (contextType: 'admin' or 'direct')
    if (contextType === 'admin' || contextType === 'direct') {
      return await this.createDirectAdminChat(contextId, senderId, contextType);
    }

    // Unsupported contextType
    throw new AppError(
      `Unsupported contextType: ${contextType}. Supported types: 'quote', 'admin', 'direct'`,
      ERROR_CODES.INVALID_REQUEST,
      400
    );
  }

  /**
   * Creates a quote-based chat
   */
  private async createQuoteBasedChat(quoteId: string, senderId: string): Promise<string> {
    // Fetch quote to get userId
    const quote = await this.quoteRepository.findById(quoteId);
    if (!quote) {
      logger.warn(`Attempt to create chat for non-existent quote: ${quoteId}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Verify sender owns the quote
    if (quote.userId !== senderId) {
      logger.warn(`User ${senderId} attempted to create chat for quote ${quoteId} owned by ${quote.userId}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Check if chat already exists for this context
    const existingChat = await this.chatRepository.findByContext('quote', quoteId);

    if (existingChat) {
      // Verify user has access to existing chat
      if (!existingChat.hasParticipant(senderId)) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
      }

      logger.info(`Using existing chat: ${existingChat.chatId} for quote: ${quoteId}`);
      return existingChat.chatId;
    }

    // Find first available admin
    const admins = await this.userRepository.findByRole(UserRole.ADMIN);
    if (admins.length === 0) {
      logger.error('No admin available to assign to chat');
      throw new AppError(ERROR_MESSAGES.NO_ADMIN_AVAILABLE, ERROR_CODES.NO_ADMIN_AVAILABLE, 503);
    }

    // Use first admin found
    const admin = admins[0];

    // Create chat with participants
    const chatId = randomUUID();
    const now = new Date();
    const participants: IChatParticipant[] = [
      {
        userId: quote.userId,
        participantType: ParticipantType.ADMIN_USER,
      },
      {
        userId: admin.userId,
        participantType: ParticipantType.ADMIN_USER,
      },
    ];

    const chat = new Chat(
      chatId,
      'quote',
      quoteId,
      ParticipantType.ADMIN_USER,
      participants,
      now,
      now
    );

    await this.chatRepository.create(chat);

    logger.info(`Auto-created chat: ${chatId} for quote: ${quoteId} with admin: ${admin.userId}`);

    return chatId;
  }

  /**
   * Creates a direct admin chat (user messaging admin without quote context)
   */
  private async createDirectAdminChat(contextId: string, senderId: string, contextType: string): Promise<string> {
    // For direct admin messaging, contextId can be any unique identifier (e.g., senderId + timestamp)
    // or we can use senderId as the contextId to ensure one chat per user for direct admin messaging

    // Check if chat already exists for this context
    const existingChat = await this.chatRepository.findByContext(contextType, contextId);

    if (existingChat) {
      // Verify user has access to existing chat
      if (!existingChat.hasParticipant(senderId)) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
      }

      logger.info(`Using existing chat: ${existingChat.chatId} for direct admin messaging: ${contextId}`);
      return existingChat.chatId;
    }

    // Find first available admin
    const admins = await this.userRepository.findByRole(UserRole.ADMIN);
    if (admins.length === 0) {
      logger.error('No admin available to assign to chat');
      throw new AppError(ERROR_MESSAGES.NO_ADMIN_AVAILABLE, ERROR_CODES.NO_ADMIN_AVAILABLE, 503);
    }

    // Use first admin found
    const admin = admins[0];

    // Create chat with participants (user and admin)
    const chatId = randomUUID();
    const now = new Date();
    const participants: IChatParticipant[] = [
      {
        userId: senderId,
        participantType: ParticipantType.ADMIN_USER,
      },
      {
        userId: admin.userId,
        participantType: ParticipantType.ADMIN_USER,
      },
    ];

    const chat = new Chat(
      chatId,
      contextType,
      contextId,
      ParticipantType.ADMIN_USER,
      participants,
      now,
      now
    );

    await this.chatRepository.create(chat);

    logger.info(`Auto-created direct admin chat: ${chatId} for user: ${senderId} with admin: ${admin.userId}`);

    return chatId;
  }
}

