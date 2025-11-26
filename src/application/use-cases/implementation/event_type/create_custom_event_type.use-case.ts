import { inject, injectable } from 'tsyringe';
import { ICreateCustomEventTypeUseCase } from '../../interface/event_type/create_custom_event_type_use_case.interface';
import { CreateCustomEventTypeRequest, EventTypeResponse } from '../../../dtos/event_type.dto';
import { IEventTypeRepository } from '../../../../domain/repositories/event_type_repository.interface';
import { EventType } from '../../../../domain/entities/event_type.entity';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use case for creating a custom event type
 * Creates a new custom event type for a user
 */
@injectable()
export class CreateCustomEventTypeUseCase implements ICreateCustomEventTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IEventTypeRepository)
    private readonly eventTypeRepository: IEventTypeRepository
  ) {}

  async execute(request: CreateCustomEventTypeRequest, userId: string): Promise<EventTypeResponse> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
      }

      if (!request) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
      }

      if (!request.name || typeof request.name !== 'string' || request.name.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
      }

      logger.info(`Creating custom event type: ${request.name} by user: ${userId}`);

      // Check if event type with same name already exists
      const existingEventType = await this.eventTypeRepository.findByName(request.name.trim());

      if (existingEventType) {
        throw new AppError(ERROR_MESSAGES.EVENT_TYPE_ALREADY_EXISTS, 'EVENT_TYPE_ALREADY_EXISTS', 409);
      }

      // Create new event type entity
      const now = new Date();
      const eventType = new EventType(
        uuidv4(),
        request.name.trim(),
        true, // isCustom
        true, // isActive
        now,
        now,
        userId // createdBy
      );

      // Save to repository
      await this.eventTypeRepository.create(eventType);

      // Fetch the created entity
      const savedEventType = await this.eventTypeRepository.findById(eventType.eventTypeId);
      if (!savedEventType) {
        throw new AppError(ERROR_MESSAGES.EVENT_TYPE_NOT_FOUND, 'EVENT_TYPE_CREATION_ERROR', 500);
      }

      // Map to response DTO
      const response: EventTypeResponse = {
        eventTypeId: savedEventType.eventTypeId,
        name: savedEventType.name,
        isCustom: savedEventType.isCustom,
        createdAt: savedEventType.createdAt,
        updatedAt: savedEventType.updatedAt,
      };

      logger.info(`Custom event type created successfully: ${response.eventTypeId}`);
      return response;
    } catch (error) {
      logger.error(
        `Error creating custom event type: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ERROR_MESSAGES.EVENT_TYPE_NOT_FOUND,
        'EVENT_TYPE_CREATION_ERROR',
        500
      );
    }
  }
}
