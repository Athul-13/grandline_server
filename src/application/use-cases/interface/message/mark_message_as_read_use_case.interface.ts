import { MarkMessageAsReadRequest, MarkMessageAsReadResponse } from '../../../dtos/message.dto';

/**
 * Use case interface for marking messages as read
 */
export interface IMarkMessageAsReadUseCase {
  execute(request: MarkMessageAsReadRequest, userId: string): Promise<MarkMessageAsReadResponse>;
}

