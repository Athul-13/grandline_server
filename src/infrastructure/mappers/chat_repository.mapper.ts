import { Chat, IChatParticipant } from '../../domain/entities/chat.entity';
import { IChatModel, IChatParticipantModel } from '../database/mongodb/models/chat.model';

/**
 * Repository mapper for Chat entity
 * Converts MongoDB documents to domain entities
 */
export class ChatRepositoryMapper {
  static toEntity(doc: IChatModel): Chat {
    const participants: IChatParticipant[] = doc.participants.map((p: IChatParticipantModel) => ({
      userId: p.userId,
      participantType: p.participantType,
    }));

    return new Chat(
      doc.chatId,
      doc.contextType,
      doc.contextId,
      doc.participantType,
      participants,
      doc.createdAt,
      doc.updatedAt
    );
  }

  static toEntities(docs: IChatModel[]): Chat[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

