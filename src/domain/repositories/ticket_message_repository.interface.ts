import { ActorType } from "../../shared/constants";
import { TicketMessage } from "../entities/ticket_message.entity";
import { IBaseRepository } from "./base_repository.interface";

export interface ITicketMessageRepository extends IBaseRepository<TicketMessage> {
  /**
   * Finds ticket messages by ticket ID (chronological order)
   */
  findByTicketId(ticketId: string): Promise<TicketMessage[]>;

  /**
   * Finds ticket messages by ticket ID with pagination
   */
  findByTicketIdPaginated(ticketId: string, page: number, limit: number): Promise<TicketMessage[]>;

  /**
   * Finds ticket messages by sender type and sender ID
   */
  findBySender(senderType: ActorType, senderId: string): Promise<TicketMessage[]>;

  /**
   * Finds the last message for a ticket
   */
  findLastMessageByTicketId(ticketId: string): Promise<TicketMessage | null>;
}
