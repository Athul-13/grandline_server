import { EventTypeResponse } from '../../../dtos/event_type.dto';

/**
 * Use case interface for getting event types
 */
export interface IGetEventTypesUseCase {
  execute(): Promise<EventTypeResponse[]>;
}

