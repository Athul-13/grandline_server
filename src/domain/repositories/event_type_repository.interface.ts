import { EventType } from '../entities/event_type.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for EventType entity operations
 * Defines the contract for data access layer implementations
 */
export interface IEventTypeRepository extends IBaseRepository<EventType> {
  /**
   * Finds event type by name
   */
  findByName(name: string): Promise<EventType | null>;

  /**
   * Finds all active event types
   */
  findActive(): Promise<EventType[]>;

  /**
   * Finds all predefined event types
   */
  findPredefined(): Promise<EventType[]>;

  /**
   * Finds all custom event types
   */
  findCustom(): Promise<EventType[]>;

  /**
   * Finds all active predefined event types
   */
  findActivePredefined(): Promise<EventType[]>;

  /**
   * Finds custom event types by creator
   */
  findCustomByCreator(userId: string): Promise<EventType[]>;
}

