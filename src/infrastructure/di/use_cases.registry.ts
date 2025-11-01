import { container } from 'tsyringe';
import { USE_CASE_TOKENS } from './tokens';
import { RegisterUserUseCase } from '../../application/use-cases/implementation/auth/register-user.use-case';
import { VerifyOtpUseCase } from '../../application/use-cases/implementation/auth/verify-otp.use-case';
import { ResendOtpUseCase } from '../../application/use-cases/implementation/auth/resend-otp.use-case';
import { LoginUserUseCase } from '../../application/use-cases/implementation/auth/login-user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/implementation/auth/refresh-token.use-case';

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
}

