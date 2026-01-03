import { GetTicketByIdResponse } from "../../../dtos/ticket.dto";

/**
 * Request DTO for assigning ticket to admin
 */
export interface AssignTicketToAdminRequest {
  adminId: string;
}

/**
 * Interface for assigning ticket to admin
 */
export interface IAssignTicketToAdminUseCase {
  execute(
    ticketId: string,
    request: AssignTicketToAdminRequest,
    requesterId: string
  ): Promise<GetTicketByIdResponse>;
}

