import { ChatListResponse } from '../../../dtos/chat.dto';

/**
 * Use case interface for getting user chats
 */
export interface IGetUserChatsUseCase {
  execute(userId: string): Promise<ChatListResponse>;
}

