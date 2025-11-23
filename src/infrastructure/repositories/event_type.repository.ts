import { injectable } from 'tsyringe';
import { IEventTypeRepository } from '../../domain/repositories/event_type_repository.interface';
import { EventType } from '../../domain/entities/event_type.entity';
import { IEventTypeModel, createEventTypeModel } from '../database/mongodb/models/event_type.model';
import { EventTypeRepositoryMapper } from '../mappers/event_type_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

/**
 * EventType repository implementation
 * Handles data persistence operations for EventType entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class EventTypeRepositoryImpl
  extends MongoBaseRepository<IEventTypeModel, EventType>
  implements IEventTypeRepository {
  private readonly eventTypeModel: IDatabaseModel<IEventTypeModel>;

  constructor() {
    const model = createEventTypeModel();
    super(model, 'eventTypeId');
    this.eventTypeModel = model;
  }

  protected toEntity(doc: IEventTypeModel): EventType {
    return EventTypeRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: EventType): Partial<IEventTypeModel> {
    return {
      eventTypeId: entity.eventTypeId,
      name: entity.name,
      isCustom: entity.isCustom,
      createdBy: entity.createdBy,
      isActive: entity.isActive,
    };
  }

  async findByName(name: string): Promise<EventType | null> {
    const doc = await this.eventTypeModel.findOne({ name });
    return doc ? this.toEntity(doc) : null;
  }

  async findActive(): Promise<EventType[]> {
    const docs = await this.eventTypeModel.find({ isActive: true });
    return EventTypeRepositoryMapper.toEntities(docs);
  }

  async findPredefined(): Promise<EventType[]> {
    const docs = await this.eventTypeModel.find({ isCustom: false });
    return EventTypeRepositoryMapper.toEntities(docs);
  }

  async findCustom(): Promise<EventType[]> {
    const docs = await this.eventTypeModel.find({ isCustom: true });
    return EventTypeRepositoryMapper.toEntities(docs);
  }

  async findActivePredefined(): Promise<EventType[]> {
    const docs = await this.eventTypeModel.find({ isCustom: false, isActive: true });
    return EventTypeRepositoryMapper.toEntities(docs);
  }

  async findCustomByCreator(userId: string): Promise<EventType[]> {
    const docs = await this.eventTypeModel.find({ isCustom: true, createdBy: userId });
    return EventTypeRepositoryMapper.toEntities(docs);
  }
}

