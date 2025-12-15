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
  // Driver FCM Token repository
  IDriverFcmTokenRepository: Symbol.for('IDriverFcmTokenRepository'),
  // Payment repository
  IPaymentRepository: Symbol.for('IPaymentRepository'),
  // Reservation repositories
  IReservationRepository: Symbol.for('IReservationRepository'),
  IReservationItineraryRepository: Symbol.for('IReservationItineraryRepository'),
  IReservationModificationRepository: Symbol.for('IReservationModificationRepository'),
  IReservationChargeRepository: Symbol.for('IReservationChargeRepository'),
} as const;

