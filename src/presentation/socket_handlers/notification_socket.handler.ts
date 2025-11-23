import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { container } from 'tsyringe';
import { USE_CASE_TOKENS } from '../../infrastructure/di/tokens';
import { ICreateNotificationUseCase } from '../../application/use-cases/interface/notification/create_notification_use_case.interface';
import { IGetUnreadNotificationCountUseCase } from '../../application/use-cases/interface/notification/mark_notification_as_read_use_case.interface';
import { CreateNotificationRequest } from '../../application/dtos/notification.dto';
import { logger } from '../../shared/logger';

/**
 * Socket event names for notifications
 */
export const NOTIFICATION_SOCKET_EVENTS = {
  // Client -> Server
  GET_UNREAD_COUNT: 'get-unread-count',
  // Server -> Client
  NOTIFICATION_RECEIVED: 'notification-received',
  UNREAD_COUNT_UPDATED: 'unread-count-updated',
  ERROR: 'error',
} as const;

/**
 * Notification socket handler
 * Handles notification-related socket events
 */
export class NotificationSocketHandler {
  private io: Server;
  private userSockets: Map<string, Set<string>>; // userId -> Set of socketIds

  constructor(io: Server) {
    this.io = io;
    this.userSockets = new Map();
  }

  /**
   * Registers all notification-related socket event handlers
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

      // Track user's socket connections
      if (!this.userSockets.has(user.userId)) {
        this.userSockets.set(user.userId, new Set());
      }
      this.userSockets.get(user.userId)?.add(socket.id);

      // Join user's notification room
      void socket.join(`user:${user.userId}`);

      // Handle get unread count
      socket.on(NOTIFICATION_SOCKET_EVENTS.GET_UNREAD_COUNT, async () => {
        await this.handleGetUnreadCount(socket, user.userId);
      });

      // Clean up on disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(user.userId, socket.id);
      });
    });
  }

  /**
   * Handles getting unread notification count
   */
  private async handleGetUnreadCount(socket: AuthenticatedSocket, userId: string): Promise<void> {
    try {
      const getUnreadCountUseCase = container.resolve<IGetUnreadNotificationCountUseCase>(
        USE_CASE_TOKENS.GetUnreadNotificationCountUseCase
      );
      const response = await getUnreadCountUseCase.execute(userId);

      socket.emit(NOTIFICATION_SOCKET_EVENTS.UNREAD_COUNT_UPDATED, response);
    } catch (error) {
      logger.error(
        `Error getting unread notification count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      socket.emit(NOTIFICATION_SOCKET_EVENTS.ERROR, {
        message: error instanceof Error ? error.message : 'Failed to get unread count',
      });
    }
  }

  /**
   * Sends a notification to a user via socket
   * This is called by the system when a notification is created
   */
  async sendNotificationToUser(userId: string, notification: CreateNotificationRequest): Promise<void> {
    try {
      // Create notification using use case
      const createNotificationUseCase = container.resolve<ICreateNotificationUseCase>(
        USE_CASE_TOKENS.CreateNotificationUseCase
      );
      const createdNotification = await createNotificationUseCase.execute(notification);

      // Emit to user's notification room
      this.io.to(`user:${userId}`).emit(NOTIFICATION_SOCKET_EVENTS.NOTIFICATION_RECEIVED, createdNotification);

      // Also update unread count
      const getUnreadCountUseCase = container.resolve<IGetUnreadNotificationCountUseCase>(
        USE_CASE_TOKENS.GetUnreadNotificationCountUseCase
      );
      const unreadCount = await getUnreadCountUseCase.execute(userId);

      this.io.to(`user:${userId}`).emit(NOTIFICATION_SOCKET_EVENTS.UNREAD_COUNT_UPDATED, unreadCount);

      logger.info(`Notification sent via socket to user: ${userId}, notification: ${createdNotification.notificationId}`);
    } catch (error) {
      logger.error(`Error sending notification to user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Broadcasts unread count update to a user
   */
  async broadcastUnreadCountUpdate(userId: string): Promise<void> {
    try {
      const getUnreadCountUseCase = container.resolve<IGetUnreadNotificationCountUseCase>(
        USE_CASE_TOKENS.GetUnreadNotificationCountUseCase
      );
      const unreadCount = await getUnreadCountUseCase.execute(userId);

      this.io.to(`user:${userId}`).emit(NOTIFICATION_SOCKET_EVENTS.UNREAD_COUNT_UPDATED, unreadCount);
    } catch (error) {
      logger.error(
        `Error broadcasting unread count update: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handles socket disconnect
   */
  private handleDisconnect(userId: string, socketId: string): void {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Checks if a user is online (has active socket connections)
   */
  isUserOnline(userId: string): boolean {
    const userSocketSet = this.userSockets.get(userId);
    return userSocketSet ? userSocketSet.size > 0 : false;
  }
}

