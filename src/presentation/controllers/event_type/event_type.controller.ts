import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { IGetEventTypesUseCase } from '../../../application/use-cases/interface/event_type/get_event_types_use_case.interface';
import { ICreateCustomEventTypeUseCase } from '../../../application/use-cases/interface/event_type/create_custom_event_type_use_case.interface';
import { CreateCustomEventTypeRequest } from '../../../application/dtos/event_type.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Event type controller
 * Handles event type operations
 */
@injectable()
export class EventTypeController {
  constructor(
    @inject(USE_CASE_TOKENS.GetEventTypesUseCase)
    private readonly getEventTypesUseCase: IGetEventTypesUseCase,
    @inject(USE_CASE_TOKENS.CreateCustomEventTypeUseCase)
    private readonly createCustomEventTypeUseCase: ICreateCustomEventTypeUseCase
  ) {}

  /**
   * Handles getting all event types
   */
  async getEventTypes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Event types fetch request');

      const response = await this.getEventTypesUseCase.execute();

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching event types: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles creating custom event type
   */
  async createCustomEventType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request = req.body as CreateCustomEventTypeRequest;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Custom event type creation request by user: ${userId}`);

      const response = await this.createCustomEventTypeUseCase.execute(request, userId);

      logger.info(`Custom event type created successfully: ${response.eventTypeId}`);
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(
        `Error creating custom event type: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

