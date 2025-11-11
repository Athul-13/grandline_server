import { container } from 'tsyringe';
import { CONTROLLER_TOKENS } from './tokens';
import { AuthController } from '../../presentation/controllers/auth/auth.controller';
import { OtpController } from '../../presentation/controllers/auth/otp.controller';
import { TokenController } from '../../presentation/controllers/auth/token.controller';
import { UserController } from '../../presentation/controllers/user/user.controller';
import { VehicleTypeController } from '../../presentation/controllers/vehicle_type/vehicle_type.controller';
import { VehicleController } from '../../presentation/controllers/vehicle/vehicle.controller';
import { AmenityController } from '../../presentation/controllers/amenity/amenity.controller';

/**
 * Registers all controller dependencies in the DI container
 * Controllers handle HTTP requests and delegate to use cases
 */
export function registerControllers(): void {
  container.register(CONTROLLER_TOKENS.AuthController, AuthController);
  container.register(CONTROLLER_TOKENS.OtpController, OtpController);
  container.register(CONTROLLER_TOKENS.TokenController, TokenController);
  container.register(CONTROLLER_TOKENS.UserController, UserController);
  container.register(CONTROLLER_TOKENS.VehicleTypeController, VehicleTypeController);
  container.register(CONTROLLER_TOKENS.VehicleController, VehicleController);
  container.register(CONTROLLER_TOKENS.AmenityController, AmenityController);
}

