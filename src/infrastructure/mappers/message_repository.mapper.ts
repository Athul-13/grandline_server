import { Message } from '../../domain/entities/message.entity';
import { IMessageModel } from '../database/mongodb/models/message.model';

/**
 * Repository mapper for Message entity
 * Converts MongoDB documents to domain entities
 */
export class MessageRepositoryMapper {
  static toEntity(doc: IMessageModel): Message {
    return new Message(
      doc.messageId,
      doc.chatId,
      doc.senderId,
      doc.content,
      doc.deliveryStatus,
      doc.createdAt,
      doc.readAt,
      doc.readBy
    );
  }

  static toEntities(docs: IMessageModel[]): Message[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

