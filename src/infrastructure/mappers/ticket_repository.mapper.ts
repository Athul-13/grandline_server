import { Ticket } from '../../domain/entities/ticket.entity';
import { ITicketModel } from '../database/mongodb/models/ticket.model';

/**
 * Repository mapper for Ticket entity
 * Converts MongoDB documents to domain entities
 */
export class TicketRepositoryMapper {
  static toEntity(doc: ITicketModel): Ticket {
    return new Ticket(
      doc.ticketId,
      doc.actorType,
      doc.actorId,
      doc.subject,
      doc.linkedEntityType ?? null,
      doc.linkedEntityId ?? null,
      doc.status,
      doc.priority,
      doc.assignedAdminId ?? null,
      doc.lastMessageAt ?? null,
      doc.createdAt,
      doc.updatedAt,
      doc.isDeleted ?? false
    );
  }

  static toEntities(docs: ITicketModel[]): Ticket[] {
    return docs.map((doc) => this.toEntity(doc));
  }

  static toPersistence(entity: Ticket): Partial<ITicketModel> {
    return {
      ticketId: entity.ticketId,
      actorType: entity.actorType,
      actorId: entity.actorId,
      subject: entity.subject,
      linkedEntityType: entity.linkedEntityType,
      linkedEntityId: entity.linkedEntityId,
      status: entity.status,
      priority: entity.priority,
      assignedAdminId: entity.assignedAdminId,
      lastMessageAt: entity.lastMessageAt,
      isDeleted: entity.isDeleted,
    };
  }
}

