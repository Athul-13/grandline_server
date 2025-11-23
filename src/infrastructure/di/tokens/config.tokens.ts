/**
 * Configuration dependency injection tokens
 * Used for identifying configuration components at runtime
 */
export const CONFIG_TOKENS = {
  // Express & Middleware
  ExpressApp: Symbol.for('ExpressApp'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  MiddlewareConfigurator: Symbol.for('MiddlewareConfigurator'),
  // Database connections
  MongoDBConnection: Symbol.for('MongoDBConnection'),
  RedisConnection: Symbol.for('RedisConnection'),
  DatabaseConnector: Symbol.for('DatabaseConnector'),
  // Application setup
  App: Symbol.for('App'),
} as const;

