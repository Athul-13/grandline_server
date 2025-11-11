import { injectable, inject } from 'tsyringe';
import { ICreateCustomEventTypeUseCase } from '../../interface/event_type/create_custom_event_type_use_case.interface';
import { IEventTypeRepository } from '../../../../domain/repositories/event_type_repository.interface';
import { CreateCustomEventTypeRequest, EventTypeResponse } from '../../../dtos/event_type.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { EventType } from '../../../../domain/entities/event_type.entity';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { randomUUID } from 'crypto';

/**
 * Use case for creating custom event type
 * Creates a new custom event type when user selects "Other"
 */
@injectable()
export class CreateCustomEventTypeUseCase implements ICreateCustomEventTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IEventTypeRepository)
    private readonly eventTypeRepository: IEventTypeRepository
  ) {}

  async execute(request: CreateCustomEventTypeRequest, userId: string): Promise<EventTypeResponse> {
    // Check if event type already exists
    const existing = await this.eventTypeRepository.findByName(request.name.trim());

    if (existing) {
      logger.warn(`Attempt to create duplicate event type: ${request.name}`);
      throw new Error(ERROR_MESSAGES.EVENT_TYPE_ALREADY_EXISTS);
    }

    const now = new Date();
    const eventType = new EventType(
      randomUUID(),
      request.name.trim(),
      true, // isCustom
      true, // isActive
      now,
      now,
      userId // createdBy
    );

    await this.eventTypeRepository.create(eventType);

    return {
      eventTypeId: eventType.eventTypeId,
      name: eventType.name,
      isCustom: eventType.isCustom,
      createdAt: eventType.createdAt,
      updatedAt: eventType.updatedAt,
    };
  }
}

