import { TicketStatus } from "../../../../shared/constants";
import { GetTicketByIdResponse } from "../../../dtos/ticket.dto";

/**
 * Request DTO for updating ticket status
 */
export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

/**
 * Interface for updating ticket status
 */
export interface IUpdateTicketStatusUseCase {
  execute(
    ticketId: string,
    request: UpdateTicketStatusRequest,
    requesterId: string
  ): Promise<GetTicketByIdResponse>;
}

