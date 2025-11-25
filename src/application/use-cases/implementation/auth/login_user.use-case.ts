import { injectable, inject } from 'tsyringe';
import { IJWTService } from '../../../../domain/services/jwt_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IOTPService } from '../../../../domain/services/otp_service.interface';
import { LoginUserRequest, LoginUserResponse } from '../../../dtos/user.dto';
import { comparePassword } from '../../../../shared/utils/password.util';
import { UserMapper } from '../../../mapper/user.mapper';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, OTP_CONFIG } from '../../../../shared/constants';
import { generateOTP } from '../../../../shared/utils/otp.util';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { EmailType, OTPEmailData } from '../../../../shared/types/email.types';
import { logger } from '../../../../shared/logger';
import { ILoginUserUseCase } from '../../interface/auth/login_user_use_case.interface';
import { AppError } from '../../../../shared/utils/app_error.util';

@injectable()
export class LoginUserUseCase implements ILoginUserUseCase {
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
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.email || typeof request.email !== 'string' || request.email.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_EMAIL, 400);
    }

    if (!request.password || typeof request.password !== 'string' || request.password.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${request.email}`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.USER_NOT_FOUND, 401);
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
      throw new AppError(ERROR_MESSAGES.ACCOUNT_NOT_VERIFIED, ERROR_CODES.AUTH_ACCOUNT_BLOCKED, 403);
    }

    if (!user.canLogin()) {
      logger.warn(`Login attempt by blocked/inactive user: ${user.email}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    const passwordHash = await this.userRepository.getPasswordHash(user.userId);
    const isValidPassword = await comparePassword(request.password, passwordHash);
    if (!isValidPassword) {
      logger.warn(`Invalid password attempt for user: ${user.email}`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.INVALID_PASSWORD, 401);
    }

    const payload = { userId: user.userId, email: user.email, role: user.role };
    const { accessToken, refreshToken } = await this.jwtService.generateTokens(payload);

    logger.info(`User logged in successfully: ${user.email}`);

    return UserMapper.toLoginResponse(user, accessToken, refreshToken);
  }
}

