import { UnreadMessageCountResponse } from '../../../dtos/message.dto';

/**
 * Use case interface for getting unread message count
 */
export interface IGetUnreadMessageCountUseCase {
  execute(chatId: string, userId: string): Promise<UnreadMessageCountResponse>;
}

