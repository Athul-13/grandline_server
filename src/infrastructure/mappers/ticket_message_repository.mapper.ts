import { TicketMessage } from '../../domain/entities/ticket_message.entity';
import { ITicketMessageModel } from '../database/mongodb/models/ticket_message.model';

/**
 * Repository mapper for TicketMessage entity
 * Converts MongoDB documents to domain entities
 */
export class TicketMessageRepositoryMapper {
  static toEntity(doc: ITicketMessageModel): TicketMessage {
    return new TicketMessage(
      doc.ticketId,
      doc.messageId,
      doc.senderType,
      doc.senderId,
      doc.content,
      doc.createdAt,
      doc.updatedAt,
      doc.isDeleted
    );
  }

  static toEntities(docs: ITicketMessageModel[]): TicketMessage[] {
    return docs.map((doc) => this.toEntity(doc));
  }

  static toPersistence(entity: TicketMessage): Partial<ITicketMessageModel> {
    return {
      messageId: entity.messageId,
      ticketId: entity.ticketId,
      senderType: entity.senderType,
      senderId: entity.senderId,
      content: entity.content,
      isDeleted: entity.isDeleted,
    };
  }
}

