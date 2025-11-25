import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { container } from 'tsyringe';
import { USE_CASE_TOKENS, SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../application/di/tokens';
import { CONFIG_TOKENS } from '../../infrastructure/di/tokens';
import { IRedisConnection } from '../../domain/services/redis_connection.interface';
import { IChatRepository } from '../../domain/repositories/chat_repository.interface';
import { logger } from '../../shared/logger';
import { ChatSocketHandler } from './chat_socket.handler';
import { ISendMessageUseCase } from '../../application/use-cases/interface/message/send_message_use_case.interface';
import { IMarkMessageAsReadUseCase } from '../../application/use-cases/interface/message/mark_message_as_read_use_case.interface';
import { ISocketEventService } from '../../domain/services/socket_event_service.interface';
import { SendMessageRequest, MarkMessageAsReadRequest, MessageResponse } from '../../application/dtos/message.dto';
import { IGetUnreadMessageCountUseCase } from '../../application/use-cases/interface/message/get_unread_message_count_use_case.interface';
import { IGetTotalUnreadMessageCountUseCase } from '../../application/use-cases/interface/message/get_total_unread_message_count_use_case.interface';
import { Message } from '../../domain/entities/message.entity';

/**
 * Socket event names for messages
 */
export const MESSAGE_SOCKET_EVENTS = {
  // Client -> Server
  SEND_MESSAGE: 'send-message',
  MARK_AS_READ: 'mark-as-read',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  // Server -> Client
  MESSAGE_SENT: 'message-sent',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
  TYPING: 'typing',
  TYPING_STOPPED: 'typing-stopped',
  UNREAD_COUNT_UPDATED: 'unread-count-updated',
  ERROR: 'error',
} as const;

/**
 * Message socket handler
 * Handles message-related socket events
 * Uses Redis for typing indicators
 */
export class MessageSocketHandler {
  private io: Server;
  private chatSocketHandler: ChatSocketHandler;
  private redis: IRedisConnection;
  private typingTimeouts: Map<string, NodeJS.Timeout>; // socketId+chatId -> timeout

  constructor(io: Server, chatSocketHandler: ChatSocketHandler) {
    this.io = io;
    this.chatSocketHandler = chatSocketHandler;
    this.redis = container.resolve<IRedisConnection>(CONFIG_TOKENS.RedisConnection);
    this.typingTimeouts = new Map();
  }

  /**
   * Redis key patterns:
   * - chat:{chatId}:typing:{userId} - Typing indicator (TTL 3 seconds)
   */

  /**
   * Registers all message-related socket event handlers
   */
  registerHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!isSocketAuthenticated(socket)) {
        return;
      }

      const user = getSocketUser(socket);
      if (!user) {
        return;
      }

      // Handle send message
      socket.on(MESSAGE_SOCKET_EVENTS.SEND_MESSAGE, async (data: SendMessageRequest) => {
        await this.handleSendMessage(socket, user.userId, data);
      });

      // Handle mark as read
      socket.on(MESSAGE_SOCKET_EVENTS.MARK_AS_READ, async (data: { chatId: string }) => {
        await this.handleMarkAsRead(socket, user.userId, data.chatId);
      });

      // Handle typing start (real-time only)
      socket.on(MESSAGE_SOCKET_EVENTS.TYPING_START, async (data: { chatId: string }) => {
        await this.handleTypingStart(socket, user.userId, data.chatId);
      });

      // Handle typing stop (real-time only)
      socket.on(MESSAGE_SOCKET_EVENTS.TYPING_STOP, async (data: { chatId: string }) => {
        await this.handleTypingStop(socket, user.userId, data.chatId);
      });

      // Clean up typing indicators on disconnect
      socket.on('disconnect', () => {
        void this.handleDisconnect(socket.id, user.userId);
      });
    });
  }


  /**
   * Handles typing start event
   */
  private async handleTypingStart(socket: AuthenticatedSocket, userId: string, chatId: string): Promise<void> {
    try {
      if (!chatId) {
        return;
      }

      const timeoutKey = `${socket.id}:${chatId}`;

      // Clear existing timeout
      const existingTimeout = this.typingTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set typing indicator in Redis with 3 second TTL
      await this.redis.setex(`chat:${chatId}:typing:${userId}`, 3, '1');

      // Emit typing indicator to other participants
      socket.to(`chat:${chatId}`).emit(MESSAGE_SOCKET_EVENTS.TYPING, { userId, chatId });

      // Set timeout to auto-stop typing after 3 seconds
      const timeout = setTimeout(() => {
        this.handleTypingStop(socket, userId, chatId).catch((error) => {
          logger.error(`Error in typing stop timeout: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });
      }, 3000);

      this.typingTimeouts.set(timeoutKey, timeout);
    } catch (error) {
      logger.error(`Error handling typing start: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handles typing stop event
   */
  private async handleTypingStop(socket: AuthenticatedSocket, userId: string, chatId: string): Promise<void> {
    try {
      if (!chatId) {
        return;
      }

      const timeoutKey = `${socket.id}:${chatId}`;

      // Clear timeout
      const timeout = this.typingTimeouts.get(timeoutKey);
      if (timeout) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(timeoutKey);
      }

      // Remove typing indicator from Redis
      await this.redis.del(`chat:${chatId}:typing:${userId}`);

      // Emit typing stopped to other participants
      socket.to(`chat:${chatId}`).emit(MESSAGE_SOCKET_EVENTS.TYPING_STOPPED, { userId, chatId });
    } catch (error) {
      logger.error(`Error handling typing stop: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Handles send message event
   */
  private async handleSendMessage(
    socket: AuthenticatedSocket,
    senderId: string,
    data: SendMessageRequest
  ): Promise<void> {
    try {
      if (!data.content || !data.content.trim()) {
        socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, {
          message: 'Message content is required',
          code: 'INVALID_REQUEST',
        });
        return;
      }

      // Validate that either chatId OR (contextType + contextId) is provided
      if (!data.chatId && (!data.contextType || !data.contextId)) {
        socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, {
          message: 'Either chatId or (contextType and contextId) must be provided',
          code: 'INVALID_REQUEST',
        });
        return;
      }

      // Use the send message use case
      const sendMessageUseCase = container.resolve<ISendMessageUseCase>(USE_CASE_TOKENS.SendMessageUseCase);
      const messageResponse = await sendMessageUseCase.execute(data, senderId);

      // Convert DTO to entity for domain service
      const messageEntity = this.messageResponseToEntity(messageResponse);

      // Emit message-sent event via socket event service
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      await socketEventService.emitMessageSent(messageEntity, senderId, messageResponse.chatId);

      // Emit unread count updates
      await this.emitUnreadCountUpdates(messageResponse.chatId, senderId);

      logger.debug(`Message sent via socket: ${messageResponse.messageId} in chat: ${messageResponse.chatId}`);
    } catch (error) {
      logger.error(`Error handling send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, {
        message: error instanceof Error ? error.message : 'Failed to send message',
        code: error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR',
      });
    }
  }

  /**
   * Handles mark as read event
   */
  private async handleMarkAsRead(socket: AuthenticatedSocket, userId: string, chatId: string): Promise<void> {
    try {
      if (!chatId) {
        socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, {
          message: 'Chat ID is required',
          code: 'INVALID_REQUEST',
        });
        return;
      }

      // Use the mark as read use case
      const markAsReadUseCase = container.resolve<IMarkMessageAsReadUseCase>(USE_CASE_TOKENS.MarkMessageAsReadUseCase);
      const request: MarkMessageAsReadRequest = { chatId };
      await markAsReadUseCase.execute(request, userId);

      // Emit message-read event via socket event service
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      socketEventService.emitMessageRead(chatId, userId);

      // Emit unread count updates
      await this.emitUnreadCountUpdates(chatId, userId);

      logger.info(`Messages marked as read via socket in chat: ${chatId} by user: ${userId}`);
    } catch (error) {
      logger.error(`Error handling mark as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
      socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, {
        message: error instanceof Error ? error.message : 'Failed to mark messages as read',
        code: error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR',
      });
    }
  }

  /**
   * Emits unread count updates to all participants in a chat
   */
  private async emitUnreadCountUpdates(chatId: string, excludeUserId: string): Promise<void> {
    try {
      // Get chat to find participants
      const chatRepository = container.resolve<IChatRepository>(REPOSITORY_TOKENS.IChatRepository);
      const chat = await chatRepository.findById(chatId);

      if (!chat) {
        return;
      }

      // Get unread count use cases
      const getUnreadCountUseCase = container.resolve<IGetUnreadMessageCountUseCase>(
        USE_CASE_TOKENS.GetUnreadMessageCountUseCase
      );
      const getTotalUnreadCountUseCase = container.resolve<IGetTotalUnreadMessageCountUseCase>(
        USE_CASE_TOKENS.GetTotalUnreadMessageCountUseCase
      );

      // Emit updates to all participants
      for (const participant of chat.participants) {
        if (participant.userId === excludeUserId) {
          continue; // Skip the user who performed the action
        }

        // Get per-chat unread count
        const chatUnreadCount = await getUnreadCountUseCase.execute(chatId, participant.userId);

        // Get total unread count
        const totalUnreadCount = await getTotalUnreadCountUseCase.execute(participant.userId);

        // Emit to participant's user room
        this.io.to(`user:${participant.userId}`).emit(MESSAGE_SOCKET_EVENTS.UNREAD_COUNT_UPDATED, {
          chatId,
          unreadCount: chatUnreadCount.unreadCount,
          totalUnreadCount: totalUnreadCount.totalUnreadCount,
        });
      }

      // Also emit to the user who performed the action (for their own total count)
      const totalUnreadCount = await getTotalUnreadCountUseCase.execute(excludeUserId);
      this.io.to(`user:${excludeUserId}`).emit(MESSAGE_SOCKET_EVENTS.UNREAD_COUNT_UPDATED, {
        chatId,
        unreadCount: 0, // They just sent/read, so their per-chat count is 0
        totalUnreadCount: totalUnreadCount.totalUnreadCount,
      });
    } catch (error) {
      logger.error(
        `Error emitting unread count updates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handles socket disconnect - cleanup typing indicators
   */
  private async handleDisconnect(socketId: string, userId: string): Promise<void> {
    // Clear all typing timeouts for this socket
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      if (key.startsWith(`${socketId}:`)) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);

        // Extract chatId from key
        const chatId = key.split(':')[1];
        if (chatId) {
          // Remove typing indicator from Redis
          await this.redis.del(`chat:${chatId}:typing:${userId}`);
        }
      }
    }
  }

  /**
   * Converts MessageResponse DTO to Message entity
   * Used when passing data to domain services
   */
  private messageResponseToEntity(messageResponse: MessageResponse): Message {
    return new Message(
      messageResponse.messageId,
      messageResponse.chatId,
      messageResponse.senderId,
      messageResponse.content,
      messageResponse.deliveryStatus,
      messageResponse.createdAt,
      messageResponse.readAt,
      messageResponse.readBy
    );
  }
}

