import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import http from 'http';
import { APP_CONFIG } from './shared/config';
import { registerAllDependencies, container, CONFIG_TOKENS } from './infrastructure/di';
import { App } from './infrastructure/config/server/app';
import { SocketConfig } from './infrastructure/config/server/socket.config';
import { ChatSocketHandler } from './presentation/socket_handlers/chat_socket.handler';
import { MessageSocketHandler } from './presentation/socket_handlers/message_socket.handler';
import { NotificationSocketHandler } from './presentation/socket_handlers/notification_socket.handler';

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

    // Register socket handlers
    const chatSocketHandler = new ChatSocketHandler(io);
    chatSocketHandler.registerHandlers();

    const messageSocketHandler = new MessageSocketHandler(io, chatSocketHandler);
    messageSocketHandler.registerHandlers();

    const notificationSocketHandler = new NotificationSocketHandler(io);
    notificationSocketHandler.registerHandlers();

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

