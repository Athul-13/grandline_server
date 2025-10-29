import { container } from 'tsyringe';
import { DEPENDENCY_TOKENS } from './tokens';
// import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
// import { VerifyOtpUseCase } from '../../../application/use-cases/verify-otp.use-case';
// import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';

/**
 * Registers all use case dependencies in the DI container
 * Use cases are application layer business operations
 */
export function registerUseCases(): void {
  // Register when use cases are created
  // container.register(
  //   DEPENDENCY_TOKENS.RegisterUserUseCase,
  //   { useClass: RegisterUserUseCase }
  // );

  // container.register(
  //   DEPENDENCY_TOKENS.VerifyOtpUseCase,
  //   { useClass: VerifyOtpUseCase }
  // );

  // container.register(
  //   DEPENDENCY_TOKENS.LoginUserUseCase,
  //   { useClass: LoginUserUseCase }
  // );

  console.log('✅ Use cases registered');
}
