import { injectable, inject } from 'tsyringe';
import { IGetTotalUnreadMessageCountUseCase } from '../../interface/message/get_total_unread_message_count_use_case.interface';
import { IMessageRepository } from '../../../../domain/repositories/message_repository.interface';
import { TotalUnreadMessageCountResponse } from '../../../dtos/message.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting total unread message count across all chats
 */
@injectable()
export class GetTotalUnreadMessageCountUseCase implements IGetTotalUnreadMessageCountUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IMessageRepository)
    private readonly messageRepository: IMessageRepository
  ) {}

  async execute(userId: string): Promise<TotalUnreadMessageCountResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    const totalUnreadCount = await this.messageRepository.getTotalUnreadCount(userId);

    return {
      totalUnreadCount,
    };
  }
}

