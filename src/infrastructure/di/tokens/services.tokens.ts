/**
 * Service dependency injection tokens
 * Used for identifying service implementations at runtime
 */
export const SERVICE_TOKENS = {
  IOTPService: Symbol.for('IOTPService'),
  IJWTService: Symbol.for('IJWTService'),
  ITokenBlacklistService: Symbol.for('ITokenBlacklistService'),
  IEmailService: Symbol.for('IEmailService'),
  ICloudinaryService: Symbol.for('ICloudinaryService'),
  IGoogleAuthService: Symbol.for('IGoogleAuthService'),
  IRouteCalculationService: Symbol.for('IRouteCalculationService'),
  IPricingCalculationService: Symbol.for('IPricingCalculationService'),
  IVehicleRecommendationService: Symbol.for('IVehicleRecommendationService'),
} as const;
