import { UnreadMessageCountResponse, TotalUnreadMessageCountResponse } from '../../../dtos/message.dto';

/**
 * Use case interface for getting unread message count
 */
export interface IGetUnreadMessageCountUseCase {
  execute(chatId: string, userId: string): Promise<UnreadMessageCountResponse>;
}

/**
 * Use case interface for getting total unread message count
 */
export interface IGetTotalUnreadMessageCountUseCase {
  execute(userId: string): Promise<TotalUnreadMessageCountResponse>;
}

