import { injectable } from 'tsyringe';
import { ITicketRepository } from '../../domain/repositories/ticket_repository.interface';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { createTicketModel, ITicketModel } from '../database/mongodb/models/ticket.model';
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
}