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
  // Socket event service
  ISocketEventService: Symbol.for('ISocketEventService'),
} as const;

