import { injectable, inject } from 'tsyringe';
import { IGetEventTypesUseCase } from '../../interface/event_type/get_event_types_use_case.interface';
import { IEventTypeRepository } from '../../../../domain/repositories/event_type_repository.interface';
import { EventTypeResponse } from '../../../dtos/event_type.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';

/**
 * Use case for getting event types
 * Retrieves all active predefined event types
 */
@injectable()
export class GetEventTypesUseCase implements IGetEventTypesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IEventTypeRepository)
    private readonly eventTypeRepository: IEventTypeRepository
  ) {}

  async execute(): Promise<EventTypeResponse[]> {
    const eventTypes = await this.eventTypeRepository.findActivePredefined();

    return eventTypes.map((eventType) => ({
      eventTypeId: eventType.eventTypeId,
      name: eventType.name,
      isCustom: eventType.isCustom,
      createdAt: eventType.createdAt,
      updatedAt: eventType.updatedAt,
    }));
  }
}

