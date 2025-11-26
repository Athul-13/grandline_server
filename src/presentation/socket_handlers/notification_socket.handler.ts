import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { container } from 'tsyringe';
import { USE_CASE_TOKENS } from '../../application/di/tokens';
import { CONFIG_TOKENS } from '../../infrastructure/di/tokens';
import { ICreateNotificationUseCase } from '../../application/use-cases/interface/notification/create_notification_use_case.interface';
import { IGetUnreadNotificationCountUseCase } from '../../application/use-cases/interface/notification/get_unread_notification_count_use_case.interface';
import { IRedisConnection } from '../../domain/services/redis_connection.interface';
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
 * Uses Redis for user socket tracking
 */
export class NotificationSocketHandler {
  private io: Server;
  private redis: IRedisConnection;

  constructor(io: Server) {
    this.io = io;
    this.redis = container.resolve<IRedisConnection>(CONFIG_TOKENS.RedisConnection);
  }

  /**
   * Redis key patterns:
   * - user:{userId}:sockets - Set of socketIds for user
   * - socket:{socketId} - userId for socket mapping
   */

  /**
   * Registers all notification-related socket event handlers
   */
  registerHandlers(): void {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      if (!isSocketAuthenticated(socket)) {
        return;
      }

      const user = getSocketUser(socket);
      if (!user) {
        return;
      }

      // Track user's socket connections in Redis
      try {
        await this.redis.sadd(`user:${user.userId}:sockets`, socket.id);
        await this.redis.set(`socket:${socket.id}`, user.userId);
        logger.info(`[NotificationSocketHandler] Tracked socket connection in Redis for user: ${user.userId}, socket: ${socket.id}`);
        
        // Clean up stale socket entries for this user
        // This removes sockets that are no longer connected but still in Redis
        try {
          const allUserSockets = await this.redis.smembers(`user:${user.userId}:sockets`);
          let staleCount = 0;
          
          for (const socketId of allUserSockets) {
            // Check if socket still exists and is connected in Socket.io
            const existingSocket = this.io.sockets.sockets.get(socketId);
            if (!existingSocket || !existingSocket.connected) {
              // Stale socket - remove it from Redis
              await this.redis.srem(`user:${user.userId}:sockets`, socketId);
              await this.redis.del(`socket:${socketId}`);
              staleCount++;
              logger.info(`[NotificationSocketHandler] Cleaned up stale socket: ${socketId} for user: ${user.userId}`);
            }
          }
          
          if (staleCount > 0) {
            logger.info(`[NotificationSocketHandler] Cleaned up ${staleCount} stale socket(s) for user: ${user.userId}`);
          }
          
          // Log final count of valid sockets
          const validSockets = await this.redis.smembers(`user:${user.userId}:sockets`);
          logger.info(`[NotificationSocketHandler] User ${user.userId} now has ${validSockets.length} valid socket(s) after cleanup`);
        } catch (cleanupError) {
          // Don't fail connection if cleanup fails - log and continue
          logger.error(
            `[NotificationSocketHandler] Error during stale socket cleanup for user ${user.userId}: ${
              cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
            }`
          );
        }
      } catch (error) {
        logger.error(
          `Failed to track socket connection in Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { userId: user.userId, socketId: socket.id }
        );
        // Continue even if Redis tracking fails - connection can still work
      }

      // Join user's notification room
      const userRoom = `user:${user.userId}`;
      await socket.join(userRoom);
      logger.info(`[NotificationSocketHandler] User ${user.userId} joined user room: ${userRoom}, socket: ${socket.id}`);

      // Handle get unread count
      socket.on(NOTIFICATION_SOCKET_EVENTS.GET_UNREAD_COUNT, async () => {
        await this.handleGetUnreadCount(socket, user.userId);
      });

      // Clean up on disconnect
      socket.on('disconnect', () => {
        void this.handleDisconnect(user.userId, socket.id);
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
  private async handleDisconnect(userId: string, socketId: string): Promise<void> {
    logger.info(`[NotificationSocketHandler] Socket disconnected: ${socketId} for user: ${userId}`);
    
    try {
      // Remove socket from user's socket set
      await this.redis.srem(`user:${userId}:sockets`, socketId);
      logger.debug(`[NotificationSocketHandler] Removed socket ${socketId} from user:${userId}:sockets`);
      
      // Remove socket mapping
      await this.redis.del(`socket:${socketId}`);
      logger.debug(`[NotificationSocketHandler] Removed socket mapping from Redis: socket:${socketId}`);
      
      // Check remaining sockets for user
      const remainingSockets = await this.redis.scard(`user:${userId}:sockets`);
      logger.debug(`[NotificationSocketHandler] User ${userId} now has ${remainingSockets} active socket(s) remaining`);
      
      logger.info(`[NotificationSocketHandler] Socket disconnect cleanup completed for user: ${userId}, socket: ${socketId}`);
    } catch (error) {
      logger.error(
        `[NotificationSocketHandler] Error during socket disconnect cleanup for user ${userId}, socket ${socketId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Checks if a user is online (has active socket connections)
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const socketCount = await this.redis.scard(`user:${userId}:sockets`);
    return socketCount > 0;
  }
}

