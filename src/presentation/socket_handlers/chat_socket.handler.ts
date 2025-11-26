import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { container } from 'tsyringe';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS, SERVICE_TOKENS } from '../../application/di/tokens';
import { CONFIG_TOKENS } from '../../infrastructure/di/tokens';
import { IChatRepository } from '../../domain/repositories/chat_repository.interface';
import { IRedisConnection } from '../../domain/services/redis_connection.interface';
import { IMarkMessageAsReadUseCase } from '../../application/use-cases/interface/message/mark_message_as_read_use_case.interface';
import { IMarkChatNotificationsAsReadUseCase } from '../../application/use-cases/interface/notification/mark_chat_notifications_as_read_use_case.interface';
import { ISocketEventService } from '../../domain/services/socket_event_service.interface';
import { IMessageRepository } from '../../domain/repositories/message_repository.interface';
import { MarkMessageAsReadRequest } from '../../application/dtos/message.dto';
import { ERROR_MESSAGES, ERROR_CODES, MessageDeliveryStatus } from '../../shared/constants';
import { logger } from '../../shared/logger';

/**
 * Socket event names for chat
 * Note: create-chat is now handled via REST API
 * Socket events are only for real-time features (presence management)
 */
export const CHAT_SOCKET_EVENTS = {
  // Client -> Server (real-time only)
  JOIN_CHAT: 'join-chat',
  LEAVE_CHAT: 'leave-chat',
  // Server -> Client
  CHAT_JOINED: 'chat-joined',
  CHAT_LEFT: 'chat-left',
  CHAT_CREATED: 'chat-created',
  ERROR: 'error',
} as const;

/**
 * Chat socket handler
 * Handles chat-related socket events
 * Uses Redis for presence management
 */
export class ChatSocketHandler {
  private io: Server;
  private redis: IRedisConnection;

  constructor(io: Server) {
    this.io = io;
    this.redis = container.resolve<IRedisConnection>(CONFIG_TOKENS.RedisConnection);
  }

  /**
   * Gets the Socket.io server instance
   */
  getIO(): Server {
    return this.io;
  }

  /**
   * Redis key patterns:
   * - chat:{chatId}:users - Set of userIds in chat
   * - user:{userId}:chats - Set of chatIds user is in
   * - socket:{socketId} - userId for socket mapping
   */

  /**
   * Registers all chat-related socket event handlers
   */
  registerHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!isSocketAuthenticated(socket)) {
        logger.warn('Unauthenticated socket connection attempt');
        (socket as AuthenticatedSocket).disconnect();
        return;
      }

      const user = getSocketUser(socket);
      if (!user) {
        logger.warn('Socket connection without user data');
        socket.disconnect();
        return;
      }

      logger.info(`Socket connected: ${socket.id} for user: ${user.userId}`);

      void this.redis.set(`socket:${socket.id}`, user.userId);

      // Handle join chat
      socket.on(CHAT_SOCKET_EVENTS.JOIN_CHAT, async (data: { chatId: string }) => {
        await this.handleJoinChat(socket, user.userId, data.chatId);
      });

      // Handle leave chat
      socket.on(CHAT_SOCKET_EVENTS.LEAVE_CHAT, (data: { chatId: string }) => {
        void this.handleLeaveChat(socket, user.userId, data.chatId);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        void this.handleDisconnect(socket, user.userId);
      });
    });
  }

  /**
   * Handles joining a chat room
   */
  private async handleJoinChat(socket: AuthenticatedSocket, userId: string, chatId: string): Promise<void> {
    try {
      if (!chatId) {
        socket.emit(CHAT_SOCKET_EVENTS.ERROR, { message: 'Chat ID is required' });
        return; 
      }

      // Verify user has access to chat
      const chatRepository = container.resolve<IChatRepository>(REPOSITORY_TOKENS.IChatRepository);
      const chat = await chatRepository.findById(chatId);

      if (!chat) {
        logger.warn(`User ${userId} attempted to join non-existent chat: ${chatId}`);
        socket.emit(CHAT_SOCKET_EVENTS.ERROR, { message: 'Chat not found', code: 'CHAT_NOT_FOUND' });
        return;
      }

      // Verify user is a participant
      if (!chat.hasParticipant(userId)) {
        logger.warn(`User ${userId} attempted to join chat ${chatId} without permission`);
        socket.emit(CHAT_SOCKET_EVENTS.ERROR, {
          message: ERROR_MESSAGES.FORBIDDEN,
          code: ERROR_CODES.FORBIDDEN,
        });
        return;
      }

      // Join the socket room for this chat
      await socket.join(`chat:${chatId}`);

      // Track user in Redis
      await this.redis.sadd(`chat:${chatId}:users`, userId);
      await this.redis.sadd(`user:${userId}:chats`, chatId);

      logger.debug(`User ${userId} joined chat: ${chatId}`);

      socket.emit(CHAT_SOCKET_EVENTS.CHAT_JOINED, { chatId });

      // Update delivery status for messages sent TO this user while they were offline
      // This upgrades SENT → DELIVERED status (1 gray tick → 2 gray ticks)
      await this.updateDeliveryStatusForUser(chatId, userId);

      // Notify other participants that user is online (for double gray tick)
      socket.to(`chat:${chatId}`).emit('user-online', { userId, chatId });

      // Automatically mark all unread messages in this chat as read when user joins
      // This upgrades DELIVERED → READ status (double gray tick → double blue tick)
      try {
        const markMessageAsReadUseCase = container.resolve<IMarkMessageAsReadUseCase>(
          USE_CASE_TOKENS.MarkMessageAsReadUseCase
        );
        const markReadRequest: MarkMessageAsReadRequest = { chatId };
        await markMessageAsReadUseCase.execute(markReadRequest, userId);

        // Emit message-read event to notify other participants
        const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
        socketEventService.emitMessageRead(chatId, userId);

        logger.debug(`Messages auto-marked as read when user ${userId} joined chat: ${chatId}`);
      } catch (error) {
        // Don't fail join-chat if mark-as-read fails - log and continue
        logger.error(
          `Error auto-marking messages as read on join: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Automatically mark all chat notifications as read when user joins
      try {
        const markChatNotificationsAsReadUseCase = container.resolve<IMarkChatNotificationsAsReadUseCase>(
          USE_CASE_TOKENS.MarkChatNotificationsAsReadUseCase
        );
        await markChatNotificationsAsReadUseCase.execute(userId, chatId);

        logger.debug(`Chat notifications auto-marked as read when user ${userId} joined chat: ${chatId}`);
      } catch (error) {
        // Don't fail join-chat if notification marking fails - log and continue
        logger.error(
          `Error auto-marking chat notifications as read on join: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } catch (error) {
      logger.error(`Error joining chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
      socket.emit(CHAT_SOCKET_EVENTS.ERROR, {
        message: error instanceof Error ? error.message : 'Failed to join chat',
      });
    }
  }

  /**
   * Handles leaving a chat room
   */
  private async handleLeaveChat(socket: AuthenticatedSocket, userId: string, chatId: string): Promise<void> {
    try {
      if (!chatId) {
        socket.emit(CHAT_SOCKET_EVENTS.ERROR, { message: 'Chat ID is required' });
        return;
      }

      // Leave the socket room
      void socket.leave(`chat:${chatId}`);

      // Remove user from Redis
      await this.redis.srem(`chat:${chatId}:users`, userId);
      await this.redis.srem(`user:${userId}:chats`, chatId);

      logger.info(`User ${userId} left chat: ${chatId}`);

      socket.emit(CHAT_SOCKET_EVENTS.CHAT_LEFT, { chatId });

      // Notify other participants that user is offline
      socket.to(`chat:${chatId}`).emit('user-offline', { userId, chatId });
    } catch (error) {
      logger.error(`Error leaving chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
      socket.emit(CHAT_SOCKET_EVENTS.ERROR, {
        message: error instanceof Error ? error.message : 'Failed to leave chat',
      });
    }
  }


  /**
   * Handles socket disconnect
   */
  private async handleDisconnect(socket: AuthenticatedSocket, userId: string): Promise<void> {
    logger.info(`[ChatSocketHandler] Socket disconnected: ${socket.id} for user: ${userId}`);

    try {
      // Remove socket mapping
      await this.redis.del(`socket:${socket.id}`);
      logger.info(`[ChatSocketHandler] Removed socket mapping from Redis: socket:${socket.id}`);

      // Get user's active chats from Redis
      const chatIds = await this.redis.smembers(`user:${userId}:chats`);
      logger.info(`[ChatSocketHandler] User ${userId} was in ${chatIds.length} chat(s) before disconnect`);
      
      if (chatIds.length > 0) {
        // Notify all chats that user went offline
        for (const chatId of chatIds) {
          socket.to(`chat:${chatId}`).emit('user-offline', { userId, chatId });
          // Remove user from chat
          await this.redis.srem(`chat:${chatId}:users`, userId);
          logger.info(`[ChatSocketHandler] Removed user ${userId} from chat ${chatId} and notified other participants`);
        }

        // Clear user's active chats
        await this.redis.sremall(`user:${userId}:chats`);
        logger.info(`[ChatSocketHandler] Cleared all active chats for user: ${userId}`);
      } else {
        logger.info(`[ChatSocketHandler] User ${userId} was not in any active chats`);
      }

      logger.info(`[ChatSocketHandler] Socket disconnect cleanup completed for user: ${userId}, socket: ${socket.id}`);
    } catch (error) {
      logger.error(
        `[ChatSocketHandler] Error during socket disconnect cleanup for user ${userId}, socket ${socket.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Gets all chat IDs a user is currently in
   */
  async getUserActiveChats(userId: string): Promise<string[]> {
    return await this.redis.smembers(`user:${userId}:chats`);
  }

  /**
   * Checks if a user is online in a specific chat
   */
  async isUserOnlineInChat(userId: string, chatId: string): Promise<boolean> {
    const result = await this.redis.sismember(`chat:${chatId}:users`, userId);
    return result === 1;
  }

  /**
   * Updates delivery status for messages sent to a user when they come online
   * Finds all messages in SENT status sent TO the user and updates them to DELIVERED
   */
  private async updateDeliveryStatusForUser(chatId: string, userId: string): Promise<void> {
    try {
      const messageRepository = container.resolve<IMessageRepository>(REPOSITORY_TOKENS.IMessageRepository);

      // Get all messages in this chat
      const messages = await messageRepository.findByChatId(chatId);

      // Find messages sent TO this user that are still in SENT status
      const pendingMessages = messages.filter(
        (msg) => msg.senderId !== userId && msg.deliveryStatus === MessageDeliveryStatus.SENT
      );

      // Update each message to DELIVERED status and emit event to sender
      for (const message of pendingMessages) {
        await messageRepository.updateDeliveryStatus(message.messageId, MessageDeliveryStatus.DELIVERED);

        // Emit message-delivered event to the sender
        this.io.to(`user:${message.senderId}`).emit('message-delivered', {
          messageId: message.messageId,
          chatId: message.chatId,
        });

        logger.debug(
          `Updated message ${message.messageId} to DELIVERED status for user ${userId} in chat ${chatId}`
        );
      }

      if (pendingMessages.length > 0) {
        logger.info(
          `Updated ${pendingMessages.length} messages to DELIVERED status for user ${userId} in chat ${chatId}`
        );
      }
    } catch (error) {
      // Don't fail join-chat if delivery status update fails - log and continue
      logger.error(
        `Error updating delivery status for user ${userId} in chat ${chatId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}

