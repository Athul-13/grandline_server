import { injectable } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/chat_repository.interface';
import { Chat } from '../../domain/entities/chat.entity';
import { IChatModel, createChatModel } from '../database/mongodb/models/chat.model';
import { ChatRepositoryMapper } from '../mappers/chat_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { ParticipantType } from '../../shared/constants';

/**
 * Chat repository implementation
 * Handles data persistence operations for Chat entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class ChatRepositoryImpl
  extends MongoBaseRepository<IChatModel, Chat>
  implements IChatRepository {
  private readonly chatModel: IDatabaseModel<IChatModel>;

  constructor() {
    const model = createChatModel();
    super(model, 'chatId');
    this.chatModel = model;
  }

  protected toEntity(doc: IChatModel): Chat {
    return ChatRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Chat): Partial<IChatModel> {
    return {
      chatId: entity.chatId,
      contextType: entity.contextType,
      contextId: entity.contextId,
      participantType: entity.participantType,
      participants: entity.participants.map((p) => ({
        userId: p.userId,
        participantType: p.participantType,
      })),
    };
  }

  async findByContext(contextType: string, contextId: string): Promise<Chat | null> {
    const doc = await this.chatModel.findOne({ contextType, contextId });
    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<Chat[]> {
    const docs = await this.chatModel.find({ 'participants.userId': userId });
    return ChatRepositoryMapper.toEntities(docs);
  }

  async findByParticipantType(participantType: ParticipantType): Promise<Chat[]> {
    const docs = await this.chatModel.find({ participantType });
    return ChatRepositoryMapper.toEntities(docs);
  }

  async findByUserIdAndParticipantType(
    userId: string,
    participantType: ParticipantType
  ): Promise<Chat[]> {
    const docs = await this.chatModel.find({
      'participants.userId': userId,
      participantType,
    });
    return ChatRepositoryMapper.toEntities(docs);
  }

  async existsByContext(contextType: string, contextId: string): Promise<boolean> {
    const doc = await this.chatModel.findOne({ contextType, contextId });
    return !!doc;
  }
}

