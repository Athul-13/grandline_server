import { injectable, inject } from 'tsyringe';
import { ISendMessageUseCase } from '../../interface/message/send_message_use_case.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { IMessageRepository } from '../../../../domain/repositories/message_repository.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IReservationItineraryRepository } from '../../../../domain/repositories/reservation_itinerary_repository.interface';
import { SendMessageRequest, MessageResponse } from '../../../dtos/message.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { Message } from '../../../../domain/entities/message.entity';
import { Chat, IChatParticipant } from '../../../../domain/entities/chat.entity';
import { MessageDeliveryStatus, ERROR_MESSAGES, ERROR_CODES, ParticipantType, UserRole } from '../../../../shared/constants';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { deriveTripWindow, isWithin24HoursOfStart, deriveTripState } from '../../../mapper/driver_dashboard.mapper';

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
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly reservationItineraryRepository: IReservationItineraryRepository
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

      // Validate 24-hour window for reservation chats
      if (chat.contextType === 'reservation') {
        await this.validateReservationChatWindow(chat.contextId, senderId);
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

    // Handle driver-based chat creation (bidirectional: admin ↔ driver)
    if (contextType === 'driver') {
      return await this.createDriverBasedChat(contextId, senderId);
    }

    // Handle reservation-based chat creation (bidirectional: user ↔ driver)
    if (contextType === 'reservation') {
      return await this.createReservationBasedChat(contextId, senderId);
    }

    // Unsupported contextType
    throw new AppError(
      `Unsupported contextType: ${contextType}. Supported types: 'quote', 'driver', 'admin', 'direct', 'reservation'`,
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

  /**
   * Creates a driver-based chat (bidirectional: admin ↔ driver)
   * Either admin or driver can initiate the chat
   */
  private async createDriverBasedChat(driverId: string, senderId: string): Promise<string> {
    let isAdmin = false;
    let isDriver = false;

    // Check if sender is admin
    const senderUser = await this.userRepository.findById(senderId);
    if (senderUser && senderUser.role === UserRole.ADMIN) {
      isAdmin = true;
    }

    // Check if sender is the driver
    if (senderId === driverId) {
      isDriver = true;
    }

    // Verify sender is either admin OR the driver themselves
    if (!isAdmin && !isDriver) {
      logger.warn(`User ${senderId} attempted to create driver chat without permission (not admin or driver)`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Verify driver exists
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      logger.warn(`Attempt to create chat for non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Check if chat already exists for this context
    const existingChat = await this.chatRepository.findByContext('driver', driverId);

    if (existingChat) {
      // Verify sender has access to existing chat
      if (!existingChat.hasParticipant(senderId)) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
      }

      logger.info(`Using existing driver chat: ${existingChat.chatId} for driver: ${driverId}`);
      return existingChat.chatId;
    }

    // Find first available admin (if driver is initiating)
    let adminId: string;
    if (isDriver) {
      // Driver is initiating - find admin
      const admins = await this.userRepository.findByRole(UserRole.ADMIN);
      if (admins.length === 0) {
        logger.error('No admin available to assign to driver chat');
        throw new AppError(ERROR_MESSAGES.NO_ADMIN_AVAILABLE, ERROR_CODES.NO_ADMIN_AVAILABLE, 503);
      }
      adminId = admins[0].userId;
    } else {
      // Admin is initiating
      adminId = senderId;
    }

    // Create new chat with participants (admin and driver)
    const chatId = randomUUID();
    const now = new Date();
    const participants: IChatParticipant[] = [
      {
        userId: adminId,
        participantType: ParticipantType.ADMIN_DRIVER,
      },
      {
        userId: driverId,
        participantType: ParticipantType.ADMIN_DRIVER,
      },
    ];

    const chat = new Chat(
      chatId,
      'driver',
      driverId,
      ParticipantType.ADMIN_DRIVER,
      participants,
      now,
      now
    );

    await this.chatRepository.create(chat);

    logger.info(`Auto-created driver chat: ${chatId} for driver: ${driverId} with admin: ${adminId}, initiated by: ${senderId}`);

    return chatId;
  }

  /**
   * Creates a reservation-based chat (bidirectional: user ↔ driver)
   * Only allowed within 24 hours before trip start
   * Either user or assigned driver can initiate the chat
   */
  private async createReservationBasedChat(reservationId: string, senderId: string): Promise<string> {
    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      logger.warn(`Attempt to create chat for non-existent reservation: ${reservationId}`);
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Verify reservation has assigned driver
    if (!reservation.assignedDriverId) {
      logger.warn(`Attempt to create chat for reservation ${reservationId} without assigned driver`);
      throw new AppError(
        'Reservation does not have an assigned driver',
        'DRIVER_NOT_ASSIGNED',
        400
      );
    }

    // Verify sender is either the user or the assigned driver
    const isUser = reservation.userId === senderId;
    const isDriver = reservation.assignedDriverId === senderId;

    if (!isUser && !isDriver) {
      logger.warn(
        `User ${senderId} attempted to create chat for reservation ${reservationId} without permission (not user or assigned driver)`
      );
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Fetch reservation itinerary to calculate trip start time
    const itineraryStops = await this.reservationItineraryRepository.findByReservationId(reservationId);
    
    if (!itineraryStops || itineraryStops.length === 0) {
      logger.warn(`Reservation ${reservationId} has no itinerary stops`);
      throw new AppError(
        'Reservation itinerary is required for chat',
        'ITINERARY_REQUIRED',
        400
      );
    }

    // Calculate trip start time from itinerary
    const { tripStartAt } = deriveTripWindow(itineraryStops);
    const now = new Date();

    // Validate 24-hour window: chat is only allowed within 24 hours before trip start
    if (!isWithin24HoursOfStart(tripStartAt, now)) {
      logger.warn(
        `Chat creation blocked for reservation ${reservationId}: trip starts at ${tripStartAt.toISOString()}, current time: ${now.toISOString()}`
      );
      throw new AppError(
        'Chat is only available within 24 hours before trip start',
        'CHAT_WINDOW_EXPIRED',
        403
      );
    }

    // Check if chat already exists for this context
    const existingChat = await this.chatRepository.findByContext('reservation', reservationId);

    if (existingChat) {
      // Verify sender has access to existing chat
      if (!existingChat.hasParticipant(senderId)) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
      }

      // Re-validate 24-hour window for existing chat (in case trip time changed)
      if (!isWithin24HoursOfStart(tripStartAt, now)) {
        logger.warn(
          `Message sending blocked for existing chat ${existingChat.chatId}: trip starts at ${tripStartAt.toISOString()}, current time: ${now.toISOString()}`
        );
        throw new AppError(
          'Chat is only available within 24 hours before trip start',
          'CHAT_WINDOW_EXPIRED',
          403
        );
      }

      logger.info(`Using existing reservation chat: ${existingChat.chatId} for reservation: ${reservationId}`);
      return existingChat.chatId;
    }

    // Create new chat with participants (user and driver)
    const chatId = randomUUID();
    const chatNow = new Date();
    const participants: IChatParticipant[] = [
      {
        userId: reservation.userId,
        participantType: ParticipantType.DRIVER_USER,
      },
      {
        userId: reservation.assignedDriverId,
        participantType: ParticipantType.DRIVER_USER,
      },
    ];

    const chat = new Chat(
      chatId,
      'reservation',
      reservationId,
      ParticipantType.DRIVER_USER,
      participants,
      chatNow,
      chatNow
    );

    await this.chatRepository.create(chat);

    logger.info(
      `Auto-created reservation chat: ${chatId} for reservation: ${reservationId} between user: ${reservation.userId} and driver: ${reservation.assignedDriverId}, initiated by: ${senderId}`
    );

    return chatId;
  }

  /**
   * Validates that reservation chat is within 24-hour window
   * Used when sending messages to existing reservation chats
   * Also blocks messaging if trip is in PAST state
   */
  private async validateReservationChatWindow(reservationId: string, senderId: string): Promise<void> {
    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      logger.warn(`Reservation ${reservationId} not found during chat window validation`);
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Verify sender is either the user or the assigned driver
    const isUser = reservation.userId === senderId;
    const isDriver = reservation.assignedDriverId === senderId;

    if (!isUser && !isDriver) {
      logger.warn(
        `User ${senderId} attempted to send message to reservation chat ${reservationId} without permission`
      );
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Fetch reservation itinerary to calculate trip start time
    const itineraryStops = await this.reservationItineraryRepository.findByReservationId(reservationId);

    if (!itineraryStops || itineraryStops.length === 0) {
      logger.warn(`Reservation ${reservationId} has no itinerary stops during chat window validation`);
      throw new AppError(
        'Reservation itinerary is required for chat',
        'ITINERARY_REQUIRED',
        400
      );
    }

    // Calculate trip window and state
    const { tripStartAt, tripEndAt } = deriveTripWindow(itineraryStops);
    const now = new Date();
    const tripState = deriveTripState({
      status: reservation.status,
      tripStartAt,
      tripEndAt,
      now,
    });

    // Block messaging if trip is PAST
    if (tripState === 'PAST') {
      logger.warn(
        `Message sending blocked for reservation ${reservationId}: trip is in PAST state (ended at ${tripEndAt.toISOString()})`
      );
      throw new AppError(
        'This trip has ended. Messaging is disabled.',
        'TRIP_ENDED',
        403
      );
    }

    // Validate 24-hour window
    if (!isWithin24HoursOfStart(tripStartAt, now)) {
      logger.warn(
        `Message sending blocked for reservation ${reservationId}: trip starts at ${tripStartAt.toISOString()}, current time: ${now.toISOString()}`
      );
      throw new AppError(
        'Chat is only available within 24 hours before trip start',
        'CHAT_WINDOW_EXPIRED',
        403
      );
    }
  }
}

