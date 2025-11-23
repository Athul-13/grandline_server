import { CreateCustomEventTypeRequest, EventTypeResponse } from '../../../dtos/event_type.dto';

/**
 * Use case interface for creating custom event type
 */
export interface ICreateCustomEventTypeUseCase {
  execute(request: CreateCustomEventTypeRequest, userId: string): Promise<EventTypeResponse>;
}

