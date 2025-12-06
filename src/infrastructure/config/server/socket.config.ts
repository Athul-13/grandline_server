// Socket.io v4 types are not fully recognized by ESLint's type checker, but are valid at runtime
// ESLint rules for this file are configured in eslint.config.js
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { ServerOptions } from 'socket.io';
import { Application } from 'express';
import { container } from 'tsyringe';
import { IJWTService } from '../../../domain/services/jwt_service.interface';
import { SERVICE_TOKENS } from '../../../application/di/tokens';
import { COOKIE_NAMES } from '../../../shared/constants';
import { JWTPayload } from '../../../domain/services/jwt_service.interface';

/**
 * Socket.io Server type
 * Using type alias to work around ESLint type checker limitation with socket.io v4
 */
type SocketIOServer = InstanceType<typeof Server>;

/**
 * Extended Socket interface with user data
 */
export interface AuthenticatedSocket extends Socket {
  data: {
    user?: JWTPayload;
  };
}

/**
 * Socket.io server configuration
 * Handles Socket.io server initialization and authentication
 */
export class SocketConfig {
  private io: SocketIOServer | null = null;

  /**
   * Initializes Socket.io server with Express app
   */
  initialize(server: HTTPServer, _app: Application): SocketIOServer {
    const options: Partial<ServerOptions> = {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    };

    this.io = new Server(server, options);

    // Set up authentication middleware
    this.setupAuthentication();

    if (!this.io) {
      throw new Error('Failed to initialize Socket.io server');
    }

    return this.io;
  }

  /**
   * Gets the Socket.io server instance
   */
  getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io server not initialized. Call initialize() first.');
    }
    return this.io;
  }

  /**
   * Sets up Socket.io authentication middleware
   * Uses hybrid approach: cookies (primary) + handshake query/auth (fallback)
   */
  private setupAuthentication(): void {
    const io = this.io;
    if (!io) {
      throw new Error('Socket.io server not initialized');
    }

    io.use((socket: Socket, next: (err?: Error) => void) => {
      void (async () => {
        try {
          const jwtService = container.resolve<IJWTService>(SERVICE_TOKENS.IJWTService);
          let token: string | undefined;

          // Try to get token from cookies (primary method)
          const cookieHeader = socket.handshake.headers.cookie;
          if (typeof cookieHeader === 'string' && cookieHeader) {
            const cookies = this.parseCookies(cookieHeader);
            token = cookies[COOKIE_NAMES.ACCESS_TOKEN];
          }

          // Fallback to query parameter or auth object
          if (!token) {
            const queryToken = socket.handshake.query.token;
            const authToken = socket.handshake.auth?.token;
            token =
              (typeof queryToken === 'string' ? queryToken : undefined) ||
              (typeof authToken === 'string' ? authToken : undefined);
          }

          // No token found
          if (!token) {
            next(new Error('Authentication token not provided'));
            return;
          }

          // Verify token
          try {
            const payload = await jwtService.verifyAccessToken(token);
            const authSocket = socket as AuthenticatedSocket;
            if (!authSocket.data) {
              authSocket.data = {};
            }
            authSocket.data.user = payload;
            next();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid token';
            next(new Error(message));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Authentication failed';
          next(new Error(message));
        }
      })();
    });
  }

  /**
   * Parses cookie string into object
   */
  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    return cookies;
  }
}

