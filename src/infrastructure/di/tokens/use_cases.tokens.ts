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
  LogoutUserUseCase: Symbol.for('LogoutUserUseCase'),
  ForgotPasswordUseCase: Symbol.for('ForgotPasswordUseCase'),
  ResetPasswordUseCase: Symbol.for('ResetPasswordUseCase'),
  GetUserProfileUseCase: Symbol.for('GetUserProfileUseCase'),
  UpdateUserProfileUseCase: Symbol.for('UpdateUserProfileUseCase'),
  GenerateUploadUrlUseCase: Symbol.for('GenerateUploadUrlUseCase'),
  GoogleAuthUseCase: Symbol.for('GoogleAuthUseCase'),
  SetupPasswordUseCase: Symbol.for('SetupPasswordUseCase'),
  LinkGoogleAccountUseCase: Symbol.for('LinkGoogleAccountUseCase'),
  ChangePasswordUseCase: Symbol.for('ChangePasswordUseCase'),
} as const;

