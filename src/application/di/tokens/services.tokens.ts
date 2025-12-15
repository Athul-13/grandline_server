/**
 * Service dependency injection tokens
 * Used for identifying service implementations at runtime
 */
export const SERVICE_TOKENS = {
  // Authentication services
  IOTPService: Symbol.for('IOTPService'),
  IJWTService: Symbol.for('IJWTService'),
  ITokenBlacklistService: Symbol.for('ITokenBlacklistService'),
  // Communication services
  IEmailService: Symbol.for('IEmailService'),
  // External services
  ICloudinaryService: Symbol.for('ICloudinaryService'),
  IGoogleAuthService: Symbol.for('IGoogleAuthService'),
  // Business logic services
  IRouteCalculationService: Symbol.for('IRouteCalculationService'),
  IPricingCalculationService: Symbol.for('IPricingCalculationService'),
  IVehicleRecommendationService: Symbol.for('IVehicleRecommendationService'),
  IPDFGenerationService: Symbol.for('IPDFGenerationService'),
  // Socket event service
  ISocketEventService: Symbol.for('ISocketEventService'),
  // Queue and auto-assignment services
  IAutoDriverAssignmentService: Symbol.for('IAutoDriverAssignmentService'),
  IQueueService: Symbol.for('IQueueService'),
  // Push notification service
  IExpoPushNotificationService: Symbol.for('IExpoPushNotificationService'),
} as const;

