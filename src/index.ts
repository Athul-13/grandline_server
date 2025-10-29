import 'reflect-metadata';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { App } from './infrastructure/config/server/app';
import { APP_CONFIG } from './shared/constants/index';
import { registerAllDependencies } from './infrastructure/config/di';

/**
 * Starts the Express server with database connection and error handling
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize Dependency Injection (must be first)
    registerAllDependencies();
    
    const app = new App();
    const expressApp = app.getApp();

    // Connect to database
    await app.connectDatabase();
    await app.connectRedis();
    
    // Start server
    expressApp.listen(APP_CONFIG.PORT, () => {
      console.log(`Server running on http://localhost:${APP_CONFIG.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

