import { GetMessagesRequest, MessageListResponse } from '../../../dtos/message.dto';

/**
 * Use case interface for getting chat messages
 */
export interface IGetChatMessagesUseCase {
  execute(request: GetMessagesRequest, userId: string): Promise<MessageListResponse>;
}

