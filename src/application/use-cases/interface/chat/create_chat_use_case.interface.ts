import { CreateChatRequest, ChatResponse } from '../../../dtos/chat.dto';

/**
 * Use case interface for creating a chat
 */
export interface ICreateChatUseCase {
  execute(request: CreateChatRequest, userId: string): Promise<ChatResponse>;
}

