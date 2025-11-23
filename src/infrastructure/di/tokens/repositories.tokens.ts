/**
 * Repository dependency injection tokens
 * Used for identifying repository implementations at runtime
 */
export const REPOSITORY_TOKENS = {
  IUserRepository: Symbol.for('IUserRepository'),
  IDriverRepository: Symbol.for('IDriverRepository'),
  IVehicleTypeRepository: Symbol.for('IVehicleTypeRepository'),
  IVehicleRepository: Symbol.for('IVehicleRepository'),
  IAmenityRepository: Symbol.for('IAmenityRepository'),
  IQuoteRepository: Symbol.for('IQuoteRepository'),
  IQuoteItineraryRepository: Symbol.for('IQuoteItineraryRepository'),
  IPassengerRepository: Symbol.for('IPassengerRepository'),
  IPricingConfigRepository: Symbol.for('IPricingConfigRepository'),
  IEventTypeRepository: Symbol.for('IEventTypeRepository'),
  IChatRepository: Symbol.for('IChatRepository'),
  IMessageRepository: Symbol.for('IMessageRepository'),
  INotificationRepository: Symbol.for('INotificationRepository'),
} as const;
