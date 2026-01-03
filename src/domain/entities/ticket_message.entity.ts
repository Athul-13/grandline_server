import { ActorType } from "../../shared/constants";

/**
 * TicketMessage domain entity representing a message in a support ticket
 */
export class TicketMessage {
  constructor(
    public readonly ticketId: string,
    public readonly messageId: string,
    public readonly senderType: ActorType,
    public readonly senderId: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly isDeleted: boolean
  ) {}
}