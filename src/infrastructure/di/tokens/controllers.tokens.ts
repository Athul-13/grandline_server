/**
 * Controller dependency injection tokens
 * Used for identifying controller implementations at runtime
 */
export const CONTROLLER_TOKENS = {
  AuthController: Symbol.for('AuthController'),
  OtpController: Symbol.for('OtpController'),
  TokenController: Symbol.for('TokenController'),
} as const;

