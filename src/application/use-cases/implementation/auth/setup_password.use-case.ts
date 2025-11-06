import { injectable, inject } from 'tsyringe';
import { ISetupPasswordUseCase } from '../../interface/auth/setup_password_use_case.interface';
import { SetupPasswordRequest, SetupPasswordResponse } from '../../../dtos/user.dto';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { hashPassword } from '../../../../shared/utils/password.util';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';

@injectable()
export class SetupPasswordUseCase implements ISetupPasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: SetupPasswordRequest): Promise<SetupPasswordResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
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

