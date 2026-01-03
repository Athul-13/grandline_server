import { ActorType, LinkedEntityType, TicketStatus } from "../../shared/constants";

/**
 * Ticket domain entity representing a ticket in the bus rental system
 * Contains core business logic and validation rules
 */
export class Ticket {
  constructor(
    public readonly ticketId: string,
    public readonly actorType: ActorType,
    public readonly actorId: string,
    public readonly subject: string,
    public readonly linkedEntityType: LinkedEntityType | null,
    public readonly linkedEntityId: string | null,
    public readonly status: TicketStatus,
    public readonly priority: string,
    public readonly assignedAdminId: string | null,
    public readonly lastMessageAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly isDeleted: boolean
  ) {}

  /**
   * Checks if a user is the actor of this ticket
   */
  isActor(userId: string): boolean {
    return this.actorId === userId;
  }
}