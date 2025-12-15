import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IOTPService } from '../../../../domain/services/otp_service.interface';
import { RegisterUserRequest, RegisterUserResponse } from '../../../dtos/user.dto';
import { User } from '../../../../domain/entities/user.entity';
import { UserRole, UserStatus, ERROR_MESSAGES, ERROR_CODES, OTP_CONFIG } from '../../../../shared/constants';
import { hashPassword } from '../../../../shared/utils/password.util';
import { generateOTP } from '../../../../shared/utils/otp.util';
import { UserMapper } from '../../../mapper/user.mapper';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../di/tokens';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { EmailType, OTPEmailData } from '../../../../shared/types/email.types';
import { logger } from '../../../../shared/logger';
import { IRegisterUserUseCase } from '../../interface/auth/register_user_use_case.interface';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

@injectable()
export class RegisterUserUseCase implements IRegisterUserUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.IOTPService)
    private readonly otpService: IOTPService,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
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

    if (!request.fullName || typeof request.fullName !== 'string' || request.fullName.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Check for existing active user
    const existing = await this.userRepository.findByEmail(request.email);
    if (existing) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, ERROR_CODES.USER_DUPLICATE_EMAIL, 409);
    }

    // Check for deleted user (to allow re-registration)
    // Only INACTIVE users (self-deleted) can re-register
    // DELETED users (admin deactivated) cannot re-register
    const deletedUser = await this.userRepository.findByEmailIncludingDeleted(request.email);
    let user: User;

    if (deletedUser && deletedUser.isDeleted && deletedUser.status === UserStatus.INACTIVE) {
      // Reactivate self-deleted user account (INACTIVE status)
      const userId = deletedUser.userId;
      const passwordHash = await hashPassword(request.password);

      // Reactivate: set status to ACTIVE (which sets isDeleted to false)
      user = await this.userRepository.updateUserStatus(userId, UserStatus.ACTIVE);

      // Update password
      await this.userRepository.updatePassword(userId, passwordHash);

      // Update profile (fullName, phoneNumber)
      await this.userRepository.updateUserProfile(userId, {
        fullName: request.fullName,
        phoneNumber: request.phoneNumber,
      });

      // Reset verification status (user needs to verify again)
      await this.userRepository.updateVerificationStatus(userId, false);

      logger.info(`Self-deleted user account reactivated: ${user.email} (${userId})`);
    } else if (deletedUser && deletedUser.status === UserStatus.DELETED) {
      // Admin-deactivated user (DELETED status) cannot re-register
      throw new AppError('This account has been deactivated by an administrator. Please contact support.', ERROR_CODES.FORBIDDEN, 403);
    } else {
      // Create new user account
      const userId = uuidv4();
      const passwordHash = await hashPassword(request.password);

      user = new User(
        userId,
        request.fullName,
        request.email,
        UserRole.USER,
        UserStatus.ACTIVE,
        '',
        false,
        new Date(),
        new Date(),
        request.phoneNumber,
        passwordHash,
        undefined
      );

      await this.userRepository.createUser(user, passwordHash);
    }

    const otp = generateOTP();
    await this.otpService.setOTP(request.email, otp);
    
    const emailData: OTPEmailData = {
      email: request.email,
      otp,
      fullName: request.fullName,
      expiryMinutes: OTP_CONFIG.EXPIRY_TIME / 60000,
    };
    await this.emailService.sendEmail(EmailType.OTP, emailData);

    // Fetch updated user to return complete data
    const finalUser = await this.userRepository.findById(user.userId);
    if (!finalUser) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    logger.info(`User registered successfully: ${finalUser.email}`);

    // Emit socket event for admin dashboard
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      socketEventService.emitUserCreated(finalUser);
    } catch (error) {
      // Don't fail user registration if socket emission fails
      logger.error('Error emitting user created event:', error);
    }

    return UserMapper.toRegisterUserResponse(finalUser);
  }
}

