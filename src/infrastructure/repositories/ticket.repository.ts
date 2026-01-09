import { injectable } from 'tsyringe';
import { ITicketRepository } from '../../domain/repositories/ticket_repository.interface';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { createTicketModel, ITicketModel, TicketDB } from '../database/mongodb/models/ticket.model';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketRepositoryMapper } from '../mappers/ticket_repository.mapper';
import { ActorType, LinkedEntityType, TicketStatus } from '../../shared/constants';

/**
 * Ticket repository implementation
 * Handles data persistence operations for Ticket entity using MongoDB
 */
@injectable()
export class TicketRepositoryImpl
  extends MongoBaseRepository<ITicketModel, Ticket>
  implements ITicketRepository {
  private readonly ticketModel: IDatabaseModel<ITicketModel>;

  constructor() {
    const model = createTicketModel();
    super(model, 'ticketId');
    this.ticketModel = model;
  }

  protected toEntity(doc: ITicketModel): Ticket {
    return TicketRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Ticket): Partial<ITicketModel> {
    return TicketRepositoryMapper.toPersistence(entity);
  }

  async findById(id: string): Promise<Ticket | null> {
    const doc = await this.ticketModel.findOne({
      ticketId: id,
      isDeleted: false,
    });
    return doc ? this.toEntity(doc) : null;
  }

  async findByActor(actorType: ActorType, actorId: string): Promise<Ticket[]> {
    const docs = await this.ticketModel.find({
      actorType,
      actorId,
      isDeleted: false,
    });
    return TicketRepositoryMapper.toEntities(docs);
  }

  async findByActorAndStatus(
    actorType: ActorType,
    actorId: string,
    status: TicketStatus
  ): Promise<Ticket[]> {
    const docs = await this.ticketModel.find({
      actorType,
      actorId,
      status,
      isDeleted: false,
    });
    return TicketRepositoryMapper.toEntities(docs);
  }

  async findByLinkedEntity(
    linkedEntityType: LinkedEntityType,
    linkedEntityId: string
  ): Promise<Ticket[]> {
    const docs = await this.ticketModel.find({
      linkedEntityType,
      linkedEntityId,
      isDeleted: false,
    });
    return TicketRepositoryMapper.toEntities(docs);
  }

  async findByStatus(status: TicketStatus): Promise<Ticket[]> {
    const docs = await this.ticketModel.find({
      status,
      isDeleted: false,
    });
    return TicketRepositoryMapper.toEntities(docs);
  }

  async findByActorType(actorType: ActorType): Promise<Ticket[]> {
    const docs = await this.ticketModel.find({
      actorType,
      isDeleted: false,
    });
    return TicketRepositoryMapper.toEntities(docs);
  }

  async findByAssignedAdmin(adminId: string): Promise<Ticket[]> {
    const docs = await this.ticketModel.find({
      assignedAdminId: adminId,
      isDeleted: false,
    });
    return TicketRepositoryMapper.toEntities(docs);
  }

  async findByAssignedAdminAndStatus(
    adminId: string,
    status: TicketStatus
  ): Promise<Ticket[]> {
    const docs = await this.ticketModel.find({
      assignedAdminId: adminId,
      status,
      isDeleted: false,
    });
    return TicketRepositoryMapper.toEntities(docs);
  }

  async findAllWithFilters(params: {
    status?: TicketStatus;
    actorType?: ActorType;
    assignedAdminId?: string;
    search?: string;
    actorIds?: string[];
    page: number;
    limit: number;
    sortBy: 'lastMessageAt' | 'createdAt';
    sortOrder: 'asc' | 'desc';
  }): Promise<{ tickets: Ticket[]; total: number }> {
    // Build query filter
    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (params.status) {
      filter.status = params.status;
    }

    if (params.actorType) {
      filter.actorType = params.actorType;
    }

    if (params.assignedAdminId) {
      filter.assignedAdminId = params.assignedAdminId;
    }

    // Add search filter - search in ticketId, subject, and actorIds
    if (params.search && params.search.trim().length > 0) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      const searchConditions: Record<string, unknown>[] = [
        { ticketId: searchRegex },
        { subject: searchRegex },
      ];

      // If actorIds are provided (from name search), include them in search
      if (params.actorIds && params.actorIds.length > 0) {
        searchConditions.push({ actorId: { $in: params.actorIds } });
      }

      filter.$or = searchConditions;
    } else if (params.actorIds && params.actorIds.length > 0) {
      // If no search text but actorIds provided, filter by actorIds only
      filter.actorId = { $in: params.actorIds };
    }

    // Build sort object
    const sortField = params.sortBy === 'lastMessageAt' ? 'lastMessageAt' : 'createdAt';
    const sortOrderValue: 1 | -1 = params.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = {};
    sort[sortField] = sortOrderValue;
    // Add secondary sort by createdAt for consistent ordering
    if (sortField !== 'createdAt') {
      sort.createdAt = -1;
    }

    // Calculate skip
    const skip = (params.page - 1) * params.limit;

    // Use Mongoose model directly for advanced queries with pagination
    const [docs, totalDocs] = await Promise.all([
      TicketDB.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(params.limit)
        .lean<ITicketModel[]>()
        .exec(),
      TicketDB.countDocuments(filter).exec(),
    ]);

    return {
      tickets: TicketRepositoryMapper.toEntities(docs),
      total: totalDocs,
    };
  }
}