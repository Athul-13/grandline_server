import { injectable, inject } from 'tsyringe';
import { IOTPService } from '../../../../domain/services/otp_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { VerifyOtpRequest, VerifyOtpResponse } from '../../../dtos/user.dto';
import { UserMapper } from '../../../mapper/user.mapper';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';

@injectable()
export class VerifyOtpUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IOTPService)
    private readonly otpService: IOTPService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const stored = await this.otpService.getOTP(request.email);
    if (!stored || stored !== request.otp) {
      throw new Error(ERROR_MESSAGES.OTP_INVALID_OR_EXPIRED);
    }

    const updatedUser = await this.userRepository.updateVerificationStatus(user.userId, true);
    await this.otpService.deleteOTP(request.email);

    logger.info(`OTP verified successfully for user: ${user.email}`);

    return UserMapper.toVerifyOtpResponse(updatedUser);
  }
}

