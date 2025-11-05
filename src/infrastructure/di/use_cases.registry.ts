import { container } from 'tsyringe';
import { USE_CASE_TOKENS } from './tokens';
import { RegisterUserUseCase } from '../../application/use-cases/implementation/auth/register_user.use-case';
import { VerifyOtpUseCase } from '../../application/use-cases/implementation/auth/verify_otp.use-case';
import { ResendOtpUseCase } from '../../application/use-cases/implementation/auth/resend_otp.use-case';
import { LoginUserUseCase } from '../../application/use-cases/implementation/auth/login_user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/implementation/auth/refresh_token.use-case';
import { LogoutUserUseCase } from '../../application/use-cases/implementation/auth/logout_user.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/implementation/auth/forgot_password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/implementation/auth/reset_password.use-case';
import { GetUserProfileUseCase } from '../../application/use-cases/implementation/user/get_user_profile.use-case';
import { UpdateUserProfileUseCase } from '../../application/use-cases/implementation/user/update_user_profile.use-case';

/**
 * Registers all use case dependencies in the DI container
 * Use cases are application layer components that orchestrate business operations
 */
export function registerUseCases(): void {
  container.register(USE_CASE_TOKENS.RegisterUserUseCase, RegisterUserUseCase);
  container.register(USE_CASE_TOKENS.VerifyOtpUseCase, VerifyOtpUseCase);
  container.register(USE_CASE_TOKENS.ResendOtpUseCase, ResendOtpUseCase);
  container.register(USE_CASE_TOKENS.LoginUserUseCase, LoginUserUseCase);
  container.register(USE_CASE_TOKENS.RefreshTokenUseCase, RefreshTokenUseCase);
  container.register(USE_CASE_TOKENS.LogoutUserUseCase, LogoutUserUseCase);
  container.register(USE_CASE_TOKENS.ForgotPasswordUseCase, ForgotPasswordUseCase);
  container.register(USE_CASE_TOKENS.ResetPasswordUseCase, ResetPasswordUseCase);
  container.register(USE_CASE_TOKENS.GetUserProfileUseCase, GetUserProfileUseCase);
  container.register(USE_CASE_TOKENS.UpdateUserProfileUseCase, UpdateUserProfileUseCase);
}

