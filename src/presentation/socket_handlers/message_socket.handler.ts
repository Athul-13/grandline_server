import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { container } from 'tsyringe';
import { USE_CASE_TOKENS, CONFIG_TOKENS } from '../../infrastructure/di/tokens';
import { ISendMessageUseCase } from '../../application/use-cases/interface/message/send_message_use_case.interface';
import { IMarkMessageAsReadUseCase } from '../../application/use-cases/interface/message/mark_message_as_read_use_case.interface';
import { IRedisConnection } from '../../domain/services/redis_connection.interface';
import { SendMessageRequest, MarkMessageAsReadRequest } from '../../application/dtos/message.dto';
import { MessageDeliveryStatus } from '../../shared/constants';
import { logger } from '../../shared/logger';
import { ChatSocketHandler } from './chat_socket.handler';

/**
 * Socket event names for messages
 */
export const MESSAGE_SOCKET_EVENTS = {
  // Client -> Server
  SEND_MESSAGE: 'send-message',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  MARK_AS_READ: 'mark-as-read',
  // Server -> Client
  MESSAGE_SENT: 'message-sent',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
  TYPING: 'typing',
  TYPING_STOPPED: 'typing-stopped',
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

      // Handle typing start
      socket.on(MESSAGE_SOCKET_EVENTS.TYPING_START, async (data: { chatId: string }) => {
        await this.handleTypingStart(socket, user.userId, data.chatId);
      });

      // Handle typing stop
      socket.on(MESSAGE_SOCKET_EVENTS.TYPING_STOP, async (data: { chatId: string }) => {
        await this.handleTypingStop(socket, user.userId, data.chatId);
      });

      // Handle mark as read
      socket.on(MESSAGE_SOCKET_EVENTS.MARK_AS_READ, async (data: MarkMessageAsReadRequest) => {
        await this.handleMarkAsRead(socket, user.userId, data);
      });

      // Clean up typing indicators on disconnect
      socket.on('disconnect', () => {
        void this.handleDisconnect(socket.id, user.userId);
      });
    });
  }

  /**
   * Handles sending a message via socket
   */
  private async handleSendMessage(
    socket: AuthenticatedSocket,
    userId: string,
    data: SendMessageRequest
  ): Promise<void> {
    try {
      if (!data.chatId || !data.content) {
        socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, { message: 'Chat ID and content are required' });
        return;
      }

      // Send message using use case
      const sendMessageUseCase = container.resolve<ISendMessageUseCase>(USE_CASE_TOKENS.SendMessageUseCase);
      const message = await sendMessageUseCase.execute(data, userId);

      logger.info(`Message sent via socket: ${message.messageId} in chat: ${data.chatId} by user: ${userId}`);

      // Emit to sender (confirmation)
      socket.emit(MESSAGE_SOCKET_EVENTS.MESSAGE_SENT, message);

      // Check if recipient is online in this chat
      const chat = this.getChatForMessage(data.chatId);
      if (!chat) {
        return;
      }

      const recipient = chat.participants.find((p) => p.userId !== userId);
      if (!recipient) {
        return;
      }

      const isRecipientOnline = await this.chatSocketHandler.isUserOnlineInChat(recipient.userId, data.chatId);

      if (isRecipientOnline) {
        // Recipient is online - mark as delivered (double gray tick)
        const deliveredMessage = {
          ...message,
          deliveryStatus: MessageDeliveryStatus.DELIVERED,
        };

        // Emit to recipient
        this.io.to(`chat:${data.chatId}`).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_DELIVERED, deliveredMessage);

        // Update message status in database (this would be done via a use case in production)
        // For now, we'll emit the delivered status
      } else {
        // Recipient is offline - message stays as SENT (single tick)
        // When recipient comes online, they'll receive it and it will be marked as delivered
        this.io.to(`chat:${data.chatId}`).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_SENT, message);
      }
    } catch (error) {
      logger.error(`Error sending message via socket: ${error instanceof Error ? error.message : 'Unknown error'}`);
      socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, {
        message: error instanceof Error ? error.message : 'Failed to send message',
      });
    }
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
   * Handles mark as read event
   */
  private async handleMarkAsRead(
    socket: AuthenticatedSocket,
    userId: string,
    data: MarkMessageAsReadRequest
  ): Promise<void> {
    try {
      if (!data.chatId) {
        socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, { message: 'Chat ID is required' });
        return;
      }

      // Mark messages as read using use case
      const markAsReadUseCase = container.resolve<IMarkMessageAsReadUseCase>(
        USE_CASE_TOKENS.MarkMessageAsReadUseCase
      );
      await markAsReadUseCase.execute(data, userId);

      logger.info(`Messages marked as read via socket in chat: ${data.chatId} by user: ${userId}`);

      // Notify other participants that messages were read (double blue tick)
      socket.to(`chat:${data.chatId}`).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_READ, {
        chatId: data.chatId,
        readBy: userId,
      });
    } catch (error) {
      logger.error(`Error marking messages as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
      socket.emit(MESSAGE_SOCKET_EVENTS.ERROR, {
        message: error instanceof Error ? error.message : 'Failed to mark messages as read',
      });
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
   * Helper to get chat for message (simplified - would use use case in production)
   */
  private getChatForMessage(_chatId: string): { participants: Array<{ userId: string }> } | null {
    // This is a placeholder - in production, you'd use GetChatByContextUseCase or similar
    // For now, return null to avoid errors
    return null;
  }
}

