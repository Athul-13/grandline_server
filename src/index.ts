import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import { APP_CONFIG } from './shared/config';
import { registerAllDependencies, container, CONFIG_TOKENS } from './infrastructure/di';
import { App } from './infrastructure/config/server/app';

/**
 * Starts the Express server with database connection and error handling
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
    
    // Start server
    expressApp.listen(APP_CONFIG.PORT, () => {
      console.log(`Server running on http://localhost:${APP_CONFIG.PORT}`);
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

