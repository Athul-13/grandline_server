import { GetMessagesByTicketRequest, GetMessagesByTicketResponse } from "../../../dtos/ticket.dto";

/**
 * Interface for getting messages by ticket
 */
export interface IGetMessagesByTicketUseCase {
    execute(
        request: GetMessagesByTicketRequest,
        requesterId: string
    ): Promise<GetMessagesByTicketResponse>
}