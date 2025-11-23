/**
 * Repository dependency injection tokens
 * Used for identifying repository implementations at runtime
 */
export const REPOSITORY_TOKENS = {
  // User & Driver repositories
  IUserRepository: Symbol.for('IUserRepository'),
  IDriverRepository: Symbol.for('IDriverRepository'),
  // Vehicle repositories
  IVehicleTypeRepository: Symbol.for('IVehicleTypeRepository'),
  IVehicleRepository: Symbol.for('IVehicleRepository'),
  // Amenity repository
  IAmenityRepository: Symbol.for('IAmenityRepository'),
  // Quote repositories
  IQuoteRepository: Symbol.for('IQuoteRepository'),
  IQuoteItineraryRepository: Symbol.for('IQuoteItineraryRepository'),
  IPassengerRepository: Symbol.for('IPassengerRepository'),
  // Pricing & Event Type repositories
  IPricingConfigRepository: Symbol.for('IPricingConfigRepository'),
  IEventTypeRepository: Symbol.for('IEventTypeRepository'),
  // Chat, Message & Notification repositories
  IChatRepository: Symbol.for('IChatRepository'),
  IMessageRepository: Symbol.for('IMessageRepository'),
  INotificationRepository: Symbol.for('INotificationRepository'),
} as const;
