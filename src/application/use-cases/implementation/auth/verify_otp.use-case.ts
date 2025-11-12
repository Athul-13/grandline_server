import { injectable, inject } from 'tsyringe';
import { IOTPService } from '../../../../domain/services/otp_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { VerifyOtpRequest, VerifyOtpResponse } from '../../../dtos/user.dto';
import { UserMapper } from '../../../mapper/user.mapper';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { IVerifyOtpUseCase } from '../../interface/auth/verify_otp_use_case.interface';
import { AppError } from '../../../../shared/utils/app_error.util';

@injectable()
export class VerifyOtpUseCase implements IVerifyOtpUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IOTPService)
    private readonly otpService: IOTPService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.email || typeof request.email !== 'string' || request.email.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_EMAIL, 400);
    }

    if (!request.otp || typeof request.otp !== 'string' || request.otp.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_OTP, 400);
    }

    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    const stored = await this.otpService.getOTP(request.email);
    if (!stored || stored !== request.otp) {
      throw new AppError(ERROR_MESSAGES.OTP_INVALID_OR_EXPIRED, ERROR_CODES.AUTH_INVALID_OTP, 400);
    }

    const updatedUser = await this.userRepository.updateVerificationStatus(user.userId, true);
    await this.otpService.deleteOTP(request.email);

    logger.info(`OTP verified successfully for user: ${user.email}`);

    return UserMapper.toVerifyOtpResponse(updatedUser);
  }
}

