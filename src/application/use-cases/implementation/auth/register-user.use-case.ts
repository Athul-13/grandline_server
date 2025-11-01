import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IOTPService } from '../../../../domain/services/otp_service.interface';
import { RegisterUserRequest, RegisterUserResponse } from '../../../dtos/user.dto';
import { User } from '../../../../domain/entities/user.entity';
import { UserRole, UserStatus, ERROR_MESSAGES, OTP_CONFIG } from '../../../../shared/constants';
import { hashPassword } from '../../../../shared/utils/password.util';
import { generateOTP } from '../../../../shared/utils/otp.util';
import { UserMapper } from '../../../mapper/user.mapper';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { EmailType, OTPEmailData } from '../../../../shared/types/email.types';
import { logger } from '../../../../shared/logger';

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.IOTPService)
    private readonly otpService: IOTPService,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const existing = await this.userRepository.findByEmail(request.email);
    if (existing) {
      throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const userId = uuidv4();
    const passwordHash = await hashPassword(request.password);

    const user = new User(
      userId,
      request.fullName,
      request.email,
      UserRole.USER,
      UserStatus.ACTIVE,
      request.phoneNumber,
      passwordHash,
      '',
      false,
      new Date(),
      new Date()
    );

    await this.userRepository.createUser(user, passwordHash);

    const otp = generateOTP();
    await this.otpService.setOTP(request.email, otp);
    
    const emailData: OTPEmailData = {
      email: request.email,
      otp,
      fullName: request.fullName,
      expiryMinutes: OTP_CONFIG.EXPIRY_TIME / 60000,
    };
    await this.emailService.sendEmail(EmailType.OTP, emailData);

    logger.info(`User registered successfully: ${user.email}`);

    return UserMapper.toRegisterUserResponse(user);
  }
}

