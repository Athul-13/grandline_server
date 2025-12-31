import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';
import { getSocketUser, isSocketAuthenticated } from '../middleware/socket_auth.middleware';
import { container } from 'tsyringe';
import { USE_CASE_TOKENS } from '../../application/di/tokens';
import { IUpdateLocationUseCase, LocationUpdatePayload } from '../../application/use-cases/interface/driver/update_location_use_case.interface';
import { logger } from '../../shared/logger';
import { AppError } from '../../shared/utils/app_error.util';

/**
 * Socket event names for location updates
 */
export const LOCATION_SOCKET_EVENTS = {
  // Client -> Server
  LOCATION_UPDATE: 'location:update',
  // Server -> Client
  LOCATION_UPDATE_RECEIVED: 'location:update-received',
  ERROR: 'error',
} as const;

/**
 * Location socket handler
 * Handles driver location updates during active trips
 * Authenticated via JWT socket middleware
 */
export class LocationSocketHandler {
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
   * Registers all location-related socket event handlers
   * Joins driver to driver:{driverId} room on connection
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

      // Only drivers can send location updates
      // Note: Assuming driver role check - adjust based on your auth system
      // For now, we'll allow any authenticated user (validation happens in use case)
      logger.info(`[LocationSocketHandler] Socket connected: ${socket.id} for user: ${user.userId}`);

      // Join driver room
      const driverRoom = `driver:${user.userId}`;
      await socket.join(driverRoom);
      logger.info(`[LocationSocketHandler] User ${user.userId} joined driver room: ${driverRoom}, socket: ${socket.id}`);

      // Handle location update
      socket.on(LOCATION_SOCKET_EVENTS.LOCATION_UPDATE, async (data: LocationUpdatePayload) => {
        await this.handleLocationUpdate(socket, user.userId, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`[LocationSocketHandler] Driver disconnected: ${user.userId}, socket: ${socket.id}`);
        // Socket.io automatically removes socket from rooms on disconnect
      });
    });
  }

  /**
   * Handles location update from driver
   */
  private async handleLocationUpdate(
    socket: AuthenticatedSocket,
    driverId: string,
    payload: LocationUpdatePayload
  ): Promise<void> {
    try {
      const updateLocationUseCase = container.resolve<IUpdateLocationUseCase>(
        USE_CASE_TOKENS.UpdateLocationUseCase
      );

      await updateLocationUseCase.execute(driverId, payload);

      // Send confirmation to driver
      socket.emit(LOCATION_SOCKET_EVENTS.LOCATION_UPDATE_RECEIVED, {
        reservationId: payload.reservationId,
        timestamp: new Date().toISOString(),
      });

      logger.debug(
        `[LocationSocketHandler] Location update processed for driver ${driverId}, reservation ${payload.reservationId}`
      );
    } catch (error) {
      logger.error(
        `[LocationSocketHandler] Error processing location update: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { driverId, reservationId: payload.reservationId }
      );

      // Send error to driver
      const errorMessage = error instanceof AppError 
        ? error.message 
        : 'Failed to update location';
      const errorCode = error instanceof AppError
        ? error.errorCode 
        : 'LOCATION_UPDATE_ERROR';

      socket.emit(LOCATION_SOCKET_EVENTS.ERROR, {
        message: errorMessage,
        code: errorCode,
        reservationId: payload.reservationId,
      });
    }
  }
}

