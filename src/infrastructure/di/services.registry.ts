import { container } from 'tsyringe';
import { SERVICE_TOKENS } from './tokens';
import { IOTPService } from '../../domain/services/otp_service.interface';
import { OTPServiceImpl } from '../service/otp.service';
import { ITokenBlacklistService } from '../../domain/services/token_blacklist_service.interface';
import { TokenBlacklistServiceImpl } from '../service/token_blacklist.service';
import { IJWTService } from '../../domain/services/jwt_service.interface';
import { JWTServiceImpl } from '../service/jwt.service';
import { IEmailService } from '../../domain/services/email_service.interface';
import { EmailServiceImpl } from '../service/email.service';
import { ICloudinaryService } from '../../domain/services/cloudinary_service.interface';
import { CloudinaryServiceImpl } from '../service/cloudinary.service';

/**
 * Registers all service dependencies in the DI container
 * Services are infrastructure implementations of domain interfaces
 */
export function registerServices(): void {
  container.register<IOTPService>(
    SERVICE_TOKENS.IOTPService,
    { useClass: OTPServiceImpl }
  );

  container.register<ITokenBlacklistService>(
    SERVICE_TOKENS.ITokenBlacklistService,
    { useClass: TokenBlacklistServiceImpl }
  );

  container.register<IJWTService>(
    SERVICE_TOKENS.IJWTService,
    { useClass: JWTServiceImpl }
  );

  container.register<IEmailService>(
    SERVICE_TOKENS.IEmailService,
    { useClass: EmailServiceImpl }
  );

  container.register<ICloudinaryService>(
    SERVICE_TOKENS.ICloudinaryService,
    { useClass: CloudinaryServiceImpl }
  );
}
