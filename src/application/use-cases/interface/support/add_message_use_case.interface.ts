import { AddMessageRequest, AddMessageResponse } from "../../../dtos/ticket.dto";

/**
 * Interface for adding a message to a ticket
 */
export interface IAddMessageUseCase {
    execute(
        request: AddMessageRequest,
        senderId: string
    ): Promise<AddMessageResponse>
}