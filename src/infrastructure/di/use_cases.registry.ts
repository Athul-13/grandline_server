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
import { GenerateUploadUrlUseCase } from '../../application/use-cases/implementation/user/generate_upload_url.use-case';
import { GoogleAuthUseCase } from '../../application/use-cases/implementation/auth/google_auth.use-case';
import { SetupPasswordUseCase } from '../../application/use-cases/implementation/auth/setup_password.use-case';
import { LinkGoogleAccountUseCase } from '../../application/use-cases/implementation/auth/link_google_account.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/implementation/user/change_password.use-case';
import { CreateVehicleTypeUseCase } from '../../application/use-cases/implementation/vehicle_type/create_vehicle_type.use-case';
import { GetVehicleTypeUseCase } from '../../application/use-cases/implementation/vehicle_type/get_vehicle_type.use-case';
import { GetAllVehicleTypesUseCase } from '../../application/use-cases/implementation/vehicle_type/get_all_vehicle_types.use-case';
import { UpdateVehicleTypeUseCase } from '../../application/use-cases/implementation/vehicle_type/update_vehicle_type.use-case';
import { DeleteVehicleTypeUseCase } from '../../application/use-cases/implementation/vehicle_type/delete_vehicle_type.use-case';
import { CreateVehicleUseCase } from '../../application/use-cases/implementation/vehicle/create_vehicle.use-case';
import { GetVehicleUseCase } from '../../application/use-cases/implementation/vehicle/get_vehicle.use-case';
import { GetAllVehiclesUseCase } from '../../application/use-cases/implementation/vehicle/get_all_vehicles.use-case';
import { GetVehiclesByTypeUseCase } from '../../application/use-cases/implementation/vehicle/get_vehicles_by_type.use-case';
import { UpdateVehicleUseCase } from '../../application/use-cases/implementation/vehicle/update_vehicle.use-case';
import { UpdateVehicleStatusUseCase } from '../../application/use-cases/implementation/vehicle/update_vehicle_status.use-case';
import { DeleteVehicleUseCase } from '../../application/use-cases/implementation/vehicle/delete_vehicle.use-case';

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
  container.register(USE_CASE_TOKENS.GenerateUploadUrlUseCase, GenerateUploadUrlUseCase);
  container.register(USE_CASE_TOKENS.GoogleAuthUseCase, GoogleAuthUseCase);
  container.register(USE_CASE_TOKENS.SetupPasswordUseCase, SetupPasswordUseCase);
  container.register(USE_CASE_TOKENS.LinkGoogleAccountUseCase, LinkGoogleAccountUseCase);
  container.register(USE_CASE_TOKENS.ChangePasswordUseCase, ChangePasswordUseCase);
  container.register(USE_CASE_TOKENS.CreateVehicleTypeUseCase, CreateVehicleTypeUseCase);
  container.register(USE_CASE_TOKENS.GetVehicleTypeUseCase, GetVehicleTypeUseCase);
  container.register(USE_CASE_TOKENS.GetAllVehicleTypesUseCase, GetAllVehicleTypesUseCase);
  container.register(USE_CASE_TOKENS.UpdateVehicleTypeUseCase, UpdateVehicleTypeUseCase);
  container.register(USE_CASE_TOKENS.DeleteVehicleTypeUseCase, DeleteVehicleTypeUseCase);
  container.register(USE_CASE_TOKENS.CreateVehicleUseCase, CreateVehicleUseCase);
  container.register(USE_CASE_TOKENS.GetVehicleUseCase, GetVehicleUseCase);
  container.register(USE_CASE_TOKENS.GetAllVehiclesUseCase, GetAllVehiclesUseCase);
  container.register(USE_CASE_TOKENS.GetVehiclesByTypeUseCase, GetVehiclesByTypeUseCase);
  container.register(USE_CASE_TOKENS.UpdateVehicleUseCase, UpdateVehicleUseCase);
  container.register(USE_CASE_TOKENS.UpdateVehicleStatusUseCase, UpdateVehicleStatusUseCase);
  container.register(USE_CASE_TOKENS.DeleteVehicleUseCase, DeleteVehicleUseCase);
}

