import { TotalUnreadMessageCountResponse } from '../../../dtos/message.dto';

/**
 * Use case interface for getting total unread message count
 */
export interface IGetTotalUnreadMessageCountUseCase {
  execute(userId: string): Promise<TotalUnreadMessageCountResponse>;
}

