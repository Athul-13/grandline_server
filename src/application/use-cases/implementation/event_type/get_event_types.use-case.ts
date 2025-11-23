import { inject, injectable } from 'tsyringe';
import { IGetEventTypesUseCase } from '../../interface/event_type/get_event_types_use_case.interface';
import { EventTypeResponse } from '../../../dtos/event_type.dto';
import { IEventTypeRepository } from '../../../../domain/repositories/event_type_repository.interface';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting all event types
 * Returns all active predefined event types
 */
@injectable()
export class GetEventTypesUseCase implements IGetEventTypesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IEventTypeRepository)
    private readonly eventTypeRepository: IEventTypeRepository
  ) {}

  async execute(): Promise<EventTypeResponse[]> {
    try {
      logger.info('Fetching all active predefined event types');

      // Get all active predefined event types
      const eventTypes = await this.eventTypeRepository.findActivePredefined();

      // Map to response DTOs
      const response: EventTypeResponse[] = eventTypes.map((eventType) => ({
        eventTypeId: eventType.eventTypeId,
        name: eventType.name,
        isCustom: eventType.isCustom,
        createdAt: eventType.createdAt,
        updatedAt: eventType.updatedAt,
      }));

      logger.info(`Successfully fetched ${response.length} event types`);
      return response;
    } catch (error) {
      logger.error(
        `Error fetching event types: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}
