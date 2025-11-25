import { injectable, inject } from 'tsyringe';
import { ISetupPasswordUseCase } from '../../interface/auth/setup_password_use_case.interface';
import { SetupPasswordRequest, SetupPasswordResponse } from '../../../dtos/user.dto';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { hashPassword } from '../../../../shared/utils/password.util';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

@injectable()
export class SetupPasswordUseCase implements ISetupPasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: SetupPasswordRequest): Promise<SetupPasswordResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    if (!request || !request.password || typeof request.password !== 'string' || request.password.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Hash the password
    const passwordHash = await hashPassword(request.password);

    // Update password
    await this.userRepository.updatePassword(userId, passwordHash);

    logger.info(`Password set for user: ${user.email}`);

    return {
      message: SUCCESS_MESSAGES.PASSWORD_SETUP_SUCCESS,
    };
  }
}

