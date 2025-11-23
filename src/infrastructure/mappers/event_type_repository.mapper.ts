import { EventType } from '../../domain/entities/event_type.entity';
import { IEventTypeModel } from '../database/mongodb/models/event_type.model';

/**
 * Repository mapper for EventType entity
 * Converts MongoDB documents to domain entities
 */
export class EventTypeRepositoryMapper {
  static toEntity(doc: IEventTypeModel): EventType {
    return new EventType(
      doc.eventTypeId,
      doc.name,
      doc.isCustom,
      doc.isActive,
      doc.createdAt,
      doc.updatedAt,
      doc.createdBy
    );
  }

  static toEntities(docs: IEventTypeModel[]): EventType[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

