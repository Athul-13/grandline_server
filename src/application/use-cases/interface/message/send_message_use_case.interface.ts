import { SendMessageRequest, MessageResponse } from '../../../dtos/message.dto';

/**
 * Use case interface for sending a message
 */
export interface ISendMessageUseCase {
  execute(request: SendMessageRequest, senderId: string): Promise<MessageResponse>;
}

