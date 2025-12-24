import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import http from 'http';
import { APP_CONFIG } from './shared/config';
import { registerAllDependencies, container, CONFIG_TOKENS, SERVICE_TOKENS } from './infrastructure/di';
import { App } from './infrastructure/config/server/app';
import { SocketConfig } from './infrastructure/config/server/socket.config';
import { ChatSocketHandler } from './presentation/socket_handlers/chat_socket.handler';
import { MessageSocketHandler } from './presentation/socket_handlers/message_socket.handler';
import { NotificationSocketHandler } from './presentation/socket_handlers/notification_socket.handler';
import { AdminSocketHandler } from './presentation/socket_handlers/admin_socket.handler';
import { LocationSocketHandler } from './presentation/socket_handlers/location_socket.handler';
import { SocketEventService } from './infrastructure/service/socket_event.service';
import { DriverAssignmentWorker } from './infrastructure/queue/workers/driver_assignment.worker';
import { DriverAssignmentScheduler } from './infrastructure/queue/scheduler/driver_assignment.scheduler';
import { driverAssignmentQueue } from './infrastructure/queue/driver_assignment.queue';
import { initializeDriverCooldownWorker } from './infrastructure/queue/workers/driver_cooldown.worker';

/**
 * Starts the Express server with database connection, Socket.io, and error handling
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize Dependency Injection (must be called before resolving App)
    registerAllDependencies();
    
    // Resolve App from DI container (will inject DatabaseConnector)
    const app = container.resolve<App>(CONFIG_TOKENS.App);
    const expressApp = app.getApp();

    // Connect to all databases (MongoDB and Redis)
    await app.connectDatabases();
    
    // Register API routes
    app.registerRoutes();
    
    // Create HTTP server from Express app
    const httpServer = http.createServer(expressApp);

    // Initialize Socket.io server
    const socketConfig = new SocketConfig();
    const io = socketConfig.initialize(httpServer, expressApp);

    // Register Socket.io server instance in DI container
    // Type assertion needed due to tsyringe Symbol type inference
    container.registerInstance(CONFIG_TOKENS.SocketIOServer as never, io);
    console.log('[Server] Socket.io server instance registered in DI container');

    // Initialize SocketEventService FIRST and set dependencies
    // This ensures the service is ready before any socket handlers try to use it
    // Type assertion needed due to tsyringe Symbol type inference
    const socketEventService: SocketEventService = container.resolve(SERVICE_TOKENS.ISocketEventService as never);
    console.log('[Server] SocketEventService resolved from DI container');
    
    socketEventService.setIOServer(io);
    console.log('[Server] SocketEventService.setIOServer() called - Socket.io server initialized in service');
    
    // Register socket handlers (they may use SocketEventService, so it must be initialized first)
    const chatSocketHandler = new ChatSocketHandler(io);
    chatSocketHandler.registerHandlers();
    console.log('[Server] ChatSocketHandler registered');

    const notificationSocketHandler = new NotificationSocketHandler(io);
    notificationSocketHandler.registerHandlers();
    console.log('[Server] NotificationSocketHandler registered');

    // Set handlers in SocketEventService (needed for checking user online status)
    socketEventService.setChatSocketHandler(chatSocketHandler);
    socketEventService.setNotificationSocketHandler(notificationSocketHandler);
    console.log('[Server] SocketEventService handlers set');

    const messageSocketHandler = new MessageSocketHandler(io, chatSocketHandler);
    messageSocketHandler.registerHandlers();
    console.log('[Server] MessageSocketHandler registered');

    const adminSocketHandler = new AdminSocketHandler(io);
    adminSocketHandler.registerHandlers();
    console.log('[Server] AdminSocketHandler registered');

    const locationSocketHandler = new LocationSocketHandler(io);
    locationSocketHandler.registerHandlers();
    console.log('[Server] LocationSocketHandler registered');

    // Initialize Bull queue workers
    const driverAssignmentWorker = new DriverAssignmentWorker();
    driverAssignmentWorker.initialize();
    console.log('[Server] Driver assignment worker initialized');

    // Initialize driver cooldown worker
    initializeDriverCooldownWorker();
    console.log('[Server] Driver cooldown worker initialized');

    // Initialize scheduler for periodic pending quotes processing
    const driverAssignmentScheduler = new DriverAssignmentScheduler();
    driverAssignmentScheduler.start();
    console.log('[Server] Driver assignment scheduler started');

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Stop scheduler
      driverAssignmentScheduler.stop();
      
      // Close queue connections
      await driverAssignmentQueue.close();
      console.log('[Server] Queue connections closed');

      // Close database connections
      await app.disconnectDatabases();
      
      // Close HTTP server
      httpServer.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => {
      void gracefulShutdown('SIGTERM');
    });
    process.on('SIGINT', () => {
      void gracefulShutdown('SIGINT');
    });

    // Start HTTP server (which includes Socket.io)
    httpServer.listen(APP_CONFIG.PORT, () => {
      console.log(`Server running on http://localhost:${APP_CONFIG.PORT}`);
      console.log(`Socket.io server initialized`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error('Unhandled error in startServer:', error);
  process.exit(1);
});

