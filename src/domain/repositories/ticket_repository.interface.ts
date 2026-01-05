import { ActorType, LinkedEntityType, TicketStatus } from "../../shared/constants";
import { Ticket } from "../entities/ticket.entity";
import { IBaseRepository } from "./base_repository.interface";

export interface ITicketRepository extends IBaseRepository<Ticket> {
  /**
   * Finds tickets by actor type and actor ID
   */
  findByActor(actorType: ActorType, actorId: string): Promise<Ticket[]>;

  /**
   * Finds tickets by actor type, actor ID, and status
   */
  findByActorAndStatus(actorType: ActorType, actorId: string, status: TicketStatus): Promise<Ticket[]>;

  /**
   * Finds tickets by linked entity type and linked entity ID
   */
  findByLinkedEntity(linkedEntityType: LinkedEntityType, linkedEntityId: string): Promise<Ticket[]>;

  /**
   * Finds tickets by status (for admin queries)
   */
  findByStatus(status: TicketStatus): Promise<Ticket[]>;

  /**
   * Finds tickets by actor type (for admin queries)
   */
  findByActorType(actorType: ActorType): Promise<Ticket[]>;

  /**
   * Finds tickets assigned to an admin
   */
  findByAssignedAdmin(adminId: string): Promise<Ticket[]>;

  /**
   * Finds tickets assigned to an admin with specific status
   */
  findByAssignedAdminAndStatus(adminId: string, status: TicketStatus): Promise<Ticket[]>;

  /**
   * Finds all tickets with filters, search, pagination and sorting (for admin queries)
   */
  findAllWithFilters(params: {
    status?: TicketStatus;
    actorType?: ActorType;
    assignedAdminId?: string;
    search?: string;
    actorIds?: string[]; // Actor IDs to search for (from user/driver name search)
    page: number;
    limit: number;
    sortBy: 'lastMessageAt' | 'createdAt';
    sortOrder: 'asc' | 'desc';
  }): Promise<{ tickets: Ticket[]; total: number }>;
}