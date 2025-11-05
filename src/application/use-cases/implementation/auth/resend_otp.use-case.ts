import { injectable, inject } from 'tsyringe';
import { IOTPService } from '../../../../domain/services/otp_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ResendOtpRequest, ResendOtpResponse } from '../../../dtos/user.dto';
import { generateOTP } from '../../../../shared/utils/otp.util';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, OTP_CONFIG } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { EmailType, OTPEmailData } from '../../../../shared/types/email.types';
import { IResendOtpUseCase } from '../../interface/auth/resend_otp_use_case.interface';

@injectable()
export class ResendOtpUseCase implements IResendOtpUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IOTPService)
    private readonly otpService: IOTPService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
  ) {}

  async execute(request: ResendOtpRequest): Promise<ResendOtpResponse> {
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    if (user.isVerified) {
      return UserMapper.toVerifyOtpResponse(user);
    }

    const otp = generateOTP();
    await this.otpService.setOTP(request.email, otp);
    
    const emailData: OTPEmailData = {
      email: request.email,
      otp,
      fullName: user.fullName,
      expiryMinutes: OTP_CONFIG.EXPIRY_TIME / 60000,
    };
    await this.emailService.sendEmail(EmailType.OTP, emailData);

    return UserMapper.toResendOtpResponse(user);
  }
}

