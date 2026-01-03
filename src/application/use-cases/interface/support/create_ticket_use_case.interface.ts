import { CreateTicketRequest, CreateTicketResponse } from "../../../dtos/ticket.dto";

/**
 * Interface for creating a ticket
 */
export interface ICreateTicketUseCase {
    execute(
        request: CreateTicketRequest,
        requesterId: string
    ): Promise<CreateTicketResponse>
}