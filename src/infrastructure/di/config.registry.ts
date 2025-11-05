import express, { Application, ErrorRequestHandler } from 'express';
import { container } from 'tsyringe';
import { CONFIG_TOKENS } from './tokens';
import { DatabaseConnector } from '../config/server/database.connector';
import { MongoDBConnection } from '../database/mongodb/mongodb_connection.impl';
import { RedisConnection } from '../database/redis/redis_connection.impl';
import { App } from '../config/server/app';
import { MiddlewareConfigurator } from '../config/server/middleware.configurator';
import { errorHandler } from '../../presentation/middleware/error_handler';
import { MiddlewareConfig } from '../config/server/middleware.configurator';

/**
 * Registers configuration-related dependencies in the DI container
 * Includes Express app, database connections, connectors, middleware configurator, and App
 * Order matters: connections must be registered before connectors that use them
 */
export function registerConfigDependencies(): void {
  // Register Express application as singleton
  const expressApp: Application = express();
  container.registerInstance<Application>(CONFIG_TOKENS.ExpressApp, expressApp);

  // Register error handler as singleton
  container.registerInstance<ErrorRequestHandler>(CONFIG_TOKENS.ErrorHandler, errorHandler);

  // Register MongoDB connection as singleton
  container.registerSingleton(CONFIG_TOKENS.MongoDBConnection, MongoDBConnection);

  // Register Redis connection as singleton
  container.registerSingleton(CONFIG_TOKENS.RedisConnection, RedisConnection);

  // Register DatabaseConnector (will inject MongoDBConnection and RedisConnection)
  container.register(CONFIG_TOKENS.DatabaseConnector, DatabaseConnector);

  // Register MiddlewareConfigurator with factory
  // Factory is needed because config parameter is a plain object, not injectable
  container.register<MiddlewareConfigurator>(CONFIG_TOKENS.MiddlewareConfigurator, {
    useFactory: (c) => {
      const app = c.resolve<Application>(CONFIG_TOKENS.ExpressApp);
      const errorHandlerInstance = c.resolve<ErrorRequestHandler>(CONFIG_TOKENS.ErrorHandler);
      const config: MiddlewareConfig = {}; // Default empty config
      return new MiddlewareConfigurator(app, errorHandlerInstance, config);
    },
  });

  // Register App (will inject ExpressApp, DatabaseConnector, and MiddlewareConfigurator)
  container.register(CONFIG_TOKENS.App, App); 
}

