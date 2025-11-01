/**
 * Configuration dependency injection tokens
 * Used for identifying configuration components at runtime
 */
export const CONFIG_TOKENS = {
  ExpressApp: Symbol.for('ExpressApp'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  MiddlewareConfigurator: Symbol.for('MiddlewareConfigurator'),
  DatabaseConnector: Symbol.for('DatabaseConnector'),
  MongoDBConnection: Symbol.for('MongoDBConnection'),
  RedisConnection: Symbol.for('RedisConnection'),
  App: Symbol.for('App'),
} as const;

