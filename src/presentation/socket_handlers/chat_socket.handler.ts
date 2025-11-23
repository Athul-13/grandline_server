import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { container } from 'tsyringe';
import { USE_CASE_TOKENS, REPOSITORY_TOKENS } from '../../infrastructure/di/tokens';
import { ICreateChatUseCase } from '../../application/use-cases/interface/chat/create_chat_use_case.interface';
import { IChatRepository } from '../../domain/repositories/chat_repository.interface';
import { CreateChatRequest } from '../../application/dtos/chat.dto';
import { ERROR_MESSAGES, ERROR_CODES } from '../../shared/constants';
import { logger } from '../../shared/logger';

/**
 * Socket event names for chat
 */
export const CHAT_SOCKET_EVENTS = {
  // Client -> Server
  JOIN_CHAT: 'join-chat',
  LEAVE_CHAT: 'leave-chat',
  CREATE_CHAT: 'create-chat',
  // Server -> Client
  CHAT_JOINED: 'chat-joined',
  CHAT_LEFT: 'chat-left',
  CHAT_CREATED: 'chat-created',
  ERROR: 'error',
} as const;

/**
 * Chat socket handler
 * Handles chat-related socket events
 */
export class ChatSocketHandler {
  private io: Server;
  private connectedUsers: Map<string, Set<string>>; // userId -> Set of chatIds

  constructor(io: Server) {
    this.io = io;
    this.connectedUsers = new Map();
  }

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

      // Initialize user's chat set
      if (!this.connectedUsers.has(user.userId)) {
        this.connectedUsers.set(user.userId, new Set());
      }

      // Handle join chat
      socket.on(CHAT_SOCKET_EVENTS.JOIN_CHAT, async (data: { chatId: string }) => {
        await this.handleJoinChat(socket, user.userId, data.chatId);
      });

      // Handle leave chat
      socket.on(CHAT_SOCKET_EVENTS.LEAVE_CHAT, (data: { chatId: string }) => {
        this.handleLeaveChat(socket, user.userId, data.chatId);
      });

      // Handle create chat
      socket.on(CHAT_SOCKET_EVENTS.CREATE_CHAT, async (data: CreateChatRequest) => {
        await this.handleCreateChat(socket, user.userId, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket, user.userId);
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

      // Track user's active chats
      const userChats = this.connectedUsers.get(userId);
      if (userChats) {
        userChats.add(chatId);
      }

      logger.info(`User ${userId} joined chat: ${chatId}`);

      // Notify user they joined
      socket.emit(CHAT_SOCKET_EVENTS.CHAT_JOINED, { chatId });

      // Notify other participants that user is online (for double gray tick)
      socket.to(`chat:${chatId}`).emit('user-online', { userId, chatId });
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
  private handleLeaveChat(socket: AuthenticatedSocket, userId: string, chatId: string): void {
    try {
      if (!chatId) {
        socket.emit(CHAT_SOCKET_EVENTS.ERROR, { message: 'Chat ID is required' });
        return;
      }

      // Leave the socket room
      socket.leave(`chat:${chatId}`);

      // Remove from user's active chats
      const userChats = this.connectedUsers.get(userId);
      if (userChats) {
        userChats.delete(chatId);
      }

      logger.info(`User ${userId} left chat: ${chatId}`);

      // Notify user they left
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
   * Handles creating a chat via socket
   */
  private async handleCreateChat(socket: AuthenticatedSocket, userId: string, data: CreateChatRequest): Promise<void> {
    try {
      const createChatUseCase = container.resolve<ICreateChatUseCase>(USE_CASE_TOKENS.CreateChatUseCase);
      const chat = await createChatUseCase.execute(data, userId);

      logger.info(`Chat created via socket: ${chat.chatId} by user: ${userId}`);

      // Notify creator
      socket.emit(CHAT_SOCKET_EVENTS.CHAT_CREATED, chat);

      // Notify other participant if they're online
      const otherParticipant = chat.participants.find((p) => p.userId !== userId);
      if (otherParticipant) {
        this.io.to(`user:${otherParticipant.userId}`).emit(CHAT_SOCKET_EVENTS.CHAT_CREATED, chat);
      }
    } catch (error) {
      logger.error(`Error creating chat via socket: ${error instanceof Error ? error.message : 'Unknown error'}`);
      socket.emit(CHAT_SOCKET_EVENTS.ERROR, {
        message: error instanceof Error ? error.message : 'Failed to create chat',
      });
    }
  }

  /**
   * Handles socket disconnect
   */
  private handleDisconnect(socket: AuthenticatedSocket, userId: string): void {
    logger.info(`Socket disconnected: ${socket.id} for user: ${userId}`);

    // Get user's active chats
    const userChats = this.connectedUsers.get(userId);
    if (userChats) {
      // Notify all chats that user went offline
      userChats.forEach((chatId) => {
        socket.to(`chat:${chatId}`).emit('user-offline', { userId, chatId });
      });

      // Clear user's active chats
      this.connectedUsers.delete(userId);
    }
  }

  /**
   * Gets all chat IDs a user is currently in
   */
  getUserActiveChats(userId: string): Set<string> {
    return this.connectedUsers.get(userId) || new Set();
  }

  /**
   * Checks if a user is online in a specific chat
   */
  isUserOnlineInChat(userId: string, chatId: string): boolean {
    const userChats = this.connectedUsers.get(userId);
    return userChats ? userChats.has(chatId) : false;
  }
}

