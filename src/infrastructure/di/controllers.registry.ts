import { container } from 'tsyringe';
import { CONTROLLER_TOKENS } from './tokens';
import { AuthController } from '../../presentation/controllers/auth/auth.controller';
import { OtpController } from '../../presentation/controllers/auth/otp.controller';
import { TokenController } from '../../presentation/controllers/auth/token.controller';

/**
 * Registers all controller dependencies in the DI container
 * Controllers handle HTTP requests and delegate to use cases
 */
export function registerControllers(): void {
  container.register(CONTROLLER_TOKENS.AuthController, AuthController);
  container.register(CONTROLLER_TOKENS.OtpController, OtpController);
  container.register(CONTROLLER_TOKENS.TokenController, TokenController);
}

