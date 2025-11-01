/**
 * Use case dependency injection tokens
 * Used for identifying use case implementations at runtime
 */
export const USE_CASE_TOKENS = {
  RegisterUserUseCase: Symbol.for('RegisterUserUseCase'),
  VerifyOtpUseCase: Symbol.for('VerifyOtpUseCase'),
  ResendOtpUseCase: Symbol.for('ResendOtpUseCase'),
  LoginUserUseCase: Symbol.for('LoginUserUseCase'),
  RefreshTokenUseCase: Symbol.for('RefreshTokenUseCase'),
} as const;

