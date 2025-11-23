import { GetChatByContextResponse } from '../../../dtos/chat.dto';

/**
 * Use case interface for getting chat by context
 */
export interface IGetChatByContextUseCase {
  execute(contextType: string, contextId: string, userId: string): Promise<GetChatByContextResponse>;
}

