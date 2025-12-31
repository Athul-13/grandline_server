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
}