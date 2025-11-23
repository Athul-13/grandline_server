import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { container } from 'tsyringe';
import { USE_CASE_TOKENS } from '../../infrastructure/di/tokens';
import { ISendMessageUseCase } from '../../application/use-cases/interface/message/send_message_use_case.interface';
import { IMarkMessageAsReadUseCase } from '../../application/use-cases/interface/message/mark_message_as_read_use_case.interface';
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
 */
export class MessageSocketHandler {
  private io: Server;
  private chatSocketHandler: ChatSocketHandler;
  private typingUsers: Map<string, Map<string, NodeJS.Timeout>>; // chatId -> userId -> timeout

  constructor(io: Server, chatSocketHandler: ChatSocketHandler) {
    this.io = io;
    this.chatSocketHandler = chatSocketHandler;
    this.typingUsers = new Map();
  }

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
      socket.on(MESSAGE_SOCKET_EVENTS.TYPING_START, (data: { chatId: string }) => {
        this.handleTypingStart(socket, user.userId, data.chatId);
      });

      // Handle typing stop
      socket.on(MESSAGE_SOCKET_EVENTS.TYPING_STOP, (data: { chatId: string }) => {
        this.handleTypingStop(socket, user.userId, data.chatId);
      });

      // Handle mark as read
      socket.on(MESSAGE_SOCKET_EVENTS.MARK_AS_READ, async (data: MarkMessageAsReadRequest) => {
        await this.handleMarkAsRead(socket, user.userId, data);
      });

      // Clean up typing indicators on disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(user.userId);
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

      const isRecipientOnline = this.chatSocketHandler.isUserOnlineInChat(recipient.userId, data.chatId);

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
  private handleTypingStart(socket: AuthenticatedSocket, userId: string, chatId: string): void {
    try {
      if (!chatId) {
        return;
      }

      // Clear existing timeout for this user in this chat
      const chatTyping = this.typingUsers.get(chatId);
      if (chatTyping) {
        const existingTimeout = chatTyping.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
      } else {
        this.typingUsers.set(chatId, new Map());
      }

      // Emit typing indicator to other participants
      socket.to(`chat:${chatId}`).emit(MESSAGE_SOCKET_EVENTS.TYPING, { userId, chatId });

      // Set timeout to auto-stop typing after 3 seconds
      const timeout = setTimeout(() => {
        this.handleTypingStop(socket, userId, chatId);
      }, 3000);

      this.typingUsers.get(chatId)?.set(userId, timeout);
    } catch (error) {
      logger.error(`Error handling typing start: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handles typing stop event
   */
  private handleTypingStop(socket: AuthenticatedSocket, userId: string, chatId: string): void {
    try {
      if (!chatId) {
        return;
      }

      // Clear timeout
      const chatTyping = this.typingUsers.get(chatId);
      if (chatTyping) {
        const timeout = chatTyping.get(userId);
        if (timeout) {
          clearTimeout(timeout);
          chatTyping.delete(userId);
        }
      }

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
  private handleDisconnect(userId: string): void {
    // Clear all typing indicators for this user
    this.typingUsers.forEach((chatTyping) => {
      if (chatTyping.has(userId)) {
        const timeout = chatTyping.get(userId);
        if (timeout) {
          clearTimeout(timeout);
        }
        chatTyping.delete(userId);
      }
    });
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

