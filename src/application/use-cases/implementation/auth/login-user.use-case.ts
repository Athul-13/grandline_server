import { injectable, inject } from 'tsyringe';
import { IJWTService } from '../../../../domain/services/jwt_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IOTPService } from '../../../../domain/services/otp_service.interface';
import { LoginUserRequest, LoginUserResponse } from '../../../dtos/user.dto';
import { comparePassword } from '../../../../shared/utils/password.util';
import { UserMapper } from '../../../mapper/user.mapper';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, OTP_CONFIG } from '../../../../shared/constants';
import { generateOTP } from '../../../../shared/utils/otp.util';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { EmailType, OTPEmailData } from '../../../../shared/types/email.types';
import { logger } from '../../../../shared/logger';

@injectable()
export class LoginUserUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.IJWTService)
    private readonly jwtService: IJWTService,
    @inject(SERVICE_TOKENS.IOTPService)
    private readonly otpService: IOTPService,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${request.email}`);
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isVerified) {
      const otp = generateOTP();
      await this.otpService.setOTP(request.email, otp);
      
      const emailData: OTPEmailData = {
        email: request.email,
        otp,
        fullName: user.fullName,
        expiryMinutes: OTP_CONFIG.EXPIRY_TIME / 60000,
      };
      await this.emailService.sendEmail(EmailType.OTP, emailData);
      
      logger.warn(`Login attempt by unverified user: ${user.email}`);
      throw new Error(ERROR_MESSAGES.ACCOUNT_NOT_VERIFIED);
    }

    if (!user.canLogin()) {
      logger.warn(`Login attempt by blocked/inactive user: ${user.email}`);
      throw new Error(ERROR_MESSAGES.FORBIDDEN);
    }

    const passwordHash = await this.userRepository.getPasswordHash(user.userId);
    const isValidPassword = await comparePassword(request.password, passwordHash);
    if (!isValidPassword) {
      logger.warn(`Invalid password attempt for user: ${user.email}`);
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const payload = { userId: user.userId, email: user.email, role: user.role };
    const { accessToken, refreshToken } = await this.jwtService.generateTokens(payload);

    logger.info(`User logged in successfully: ${user.email}`);

    return UserMapper.toLoginResponse(user, accessToken, refreshToken);
  }
}

