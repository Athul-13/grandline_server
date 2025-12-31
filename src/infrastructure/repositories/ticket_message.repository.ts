import { injectable } from 'tsyringe';
import { ITicketMessageRepository } from '../../domain/repositories/ticket_message_repository.interface';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { createTicketMessageModel, ITicketMessageModel } from '../database/mongodb/models/ticket_message.model';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { TicketMessage } from '../../domain/entities/ticket_message.entity';
import { TicketMessageRepositoryMapper } from '../mappers/ticket_message_repository.mapper';
import { ActorType } from '../../shared/constants';

/**
 * TicketMessage repository implementation
 * Handles data persistence operations for TicketMessage entity using MongoDB
 */
@injectable()
export class TicketMessageRepositoryImpl
  extends MongoBaseRepository<ITicketMessageModel, TicketMessage>
  implements ITicketMessageRepository {
  private readonly ticketMessageModel: IDatabaseModel<ITicketMessageModel>;

  constructor() {
    const model = createTicketMessageModel();
    super(model, 'messageId');
    this.ticketMessageModel = model;
  }

  protected toEntity(doc: ITicketMessageModel): TicketMessage {
    return TicketMessageRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: TicketMessage): Partial<ITicketMessageModel> {
    return TicketMessageRepositoryMapper.toPersistence(entity);
  }

  async findById(id: string): Promise<TicketMessage | null> {
    const doc = await this.ticketMessageModel.findOne({
      messageId: id,
      isDeleted: false,
    });
    return doc ? this.toEntity(doc) : null;
  }

  async findByTicketId(ticketId: string): Promise<TicketMessage[]> {
    const docs = await this.ticketMessageModel.find(
      { ticketId, isDeleted: false },
      { sort: { createdAt: 1 } }
    );
    return TicketMessageRepositoryMapper.toEntities(docs);
  }

  async findByTicketIdPaginated(
    ticketId: string,
    page: number,
    limit: number
  ): Promise<TicketMessage[]> {
    const skip = (page - 1) * limit;
    // Note: This is a simplified pagination. For production, consider using cursor-based pagination
    // or extending IDatabaseModel to support skip/limit natively
    const allDocs = await this.ticketMessageModel.find(
      { ticketId, isDeleted: false },
      { sort: { createdAt: 1 } }
    );
    const paginatedDocs = allDocs.slice(skip, skip + limit);
    return TicketMessageRepositoryMapper.toEntities(paginatedDocs);
  }

  async findBySender(senderType: ActorType, senderId: string): Promise<TicketMessage[]> {
    const docs = await this.ticketMessageModel.find({
      senderType,
      senderId,
      isDeleted: false,
    });
    return TicketMessageRepositoryMapper.toEntities(docs);
  }

  async findLastMessageByTicketId(ticketId: string): Promise<TicketMessage | null> {
    const docs = await this.ticketMessageModel.find(
      { ticketId, isDeleted: false },
      { sort: { createdAt: -1 } }
    );
    if (docs.length === 0) {
      return null;
    }
    return this.toEntity(docs[0]);
  }
}

