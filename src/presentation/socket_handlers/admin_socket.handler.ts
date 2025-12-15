import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { UserRole } from '../../shared/constants';
import { logger } from '../../shared/logger';

/**
 * Admin socket handler
 * Handles admin-specific socket connections and room management
 * Joins admin users to admin:dashboard room for real-time updates
 */
export class AdminSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Gets the Socket.io server instance
   */
  getIO(): Server {
    return this.io;
  }

  /**
   * Registers admin socket event handlers
   * Joins admin users to admin:dashboard room on connection
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

      // Check if user is admin
      if (user.role !== UserRole.ADMIN) {
        return; // Not an admin, skip admin-specific handling
      }

      logger.info(`[AdminSocketHandler] Admin user connected: ${user.userId}, socket: ${socket.id}`);

      // Join admin dashboard room
      await socket.join('admin:dashboard');
      logger.info(`[AdminSocketHandler] Admin user ${user.userId} joined admin:dashboard room`);

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`[AdminSocketHandler] Admin user disconnected: ${user.userId}, socket: ${socket.id}`);
        // Socket.io automatically removes socket from rooms on disconnect
      });
    });
  }
}

