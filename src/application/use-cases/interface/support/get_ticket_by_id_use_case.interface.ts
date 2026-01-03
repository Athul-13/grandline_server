import { GetTicketByIdResponse } from "../../../dtos/ticket.dto";

/**
 * Interface for getting a ticket by ID
 */
export interface IGetTicketByIdUseCase {
    execute(
        ticketId: string,
        requesterId: string
    ): Promise<GetTicketByIdResponse>
}