/**
 * Controller dependency injection tokens
 * Used for identifying controller implementations at runtime
 */
export const CONTROLLER_TOKENS = {
  // Auth controllers
  AuthController: Symbol.for('AuthController'),
  OtpController: Symbol.for('OtpController'),
  TokenController: Symbol.for('TokenController'),
  // User controller
  UserController: Symbol.for('UserController'),
  // Vehicle controllers
  VehicleTypeController: Symbol.for('VehicleTypeController'),
  VehicleController: Symbol.for('VehicleController'),
  // Quote controllers
  QuoteController: Symbol.for('QuoteController'),
  AdminQuoteController: Symbol.for('AdminQuoteController'),
  // Other controllers
  AmenityController: Symbol.for('AmenityController'),
  EventTypeController: Symbol.for('EventTypeController'),
  AdminPricingConfigController: Symbol.for('AdminPricingConfigController'),
  AdminUserController: Symbol.for('AdminUserController'),
  AdminDriverController: Symbol.for('AdminDriverController'),
  // Chat, Message & Notification controllers
  ChatController: Symbol.for('ChatController'),
  MessageController: Symbol.for('MessageController'),
  NotificationController: Symbol.for('NotificationController'),
} as const;

