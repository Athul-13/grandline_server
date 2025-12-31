import { GetAllTicketsRequest, GetAllTicketsResponse } from "../../../dtos/ticket.dto";

/**
 * Interface for getting all tickets
 */
export interface IGetAllTicketsUseCase {
    execute(
        request: GetAllTicketsRequest,
        requesterId: string
    ): Promise<GetAllTicketsResponse>
}