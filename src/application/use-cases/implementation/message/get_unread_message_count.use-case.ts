import { injectable, inject } from 'tsyringe';
import { IGetUnreadMessageCountUseCase } from '../../interface/message/get_unread_message_count_use_case.interface';
import { IMessageRepository } from '../../../../domain/repositories/message_repository.interface';
import { UnreadMessageCountResponse } from '../../../dtos/message.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting unread message count for a specific chat
 */
@injectable()
export class GetUnreadMessageCountUseCase implements IGetUnreadMessageCountUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IMessageRepository)
    private readonly messageRepository: IMessageRepository
  ) {}

  async execute(chatId: string, userId: string): Promise<UnreadMessageCountResponse> {
    // Input validation
    if (!chatId || typeof chatId !== 'string' || chatId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CHAT_ID', 400);
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    const unreadCount = await this.messageRepository.getUnreadCount(chatId, userId);

    return {
      chatId,
      unreadCount,
    };
  }
}

