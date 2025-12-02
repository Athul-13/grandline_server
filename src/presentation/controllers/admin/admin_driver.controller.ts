import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ICreateDriverUseCase } from '../../../application/use-cases/interface/driver/create_driver_use_case.interface';
import { CreateDriverRequest } from '../../../application/dtos/driver.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Admin driver controller
 * Handles admin driver management operations
 */
@injectable()
export class AdminDriverController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateDriverUseCase)
    private readonly createDriverUseCase: ICreateDriverUseCase,
  ) {}

  /**
   * Handles creating a new driver
   */
  async createDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Create driver attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as CreateDriverRequest;
      logger.info(`Admin ${req.user.userId} creating driver: ${request.email}`);
      
      const response = await this.createDriverUseCase.execute(request);
      
      logger.info(`Driver created successfully: ${request.email}`);
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response, SUCCESS_MESSAGES.DRIVER_CREATED);
    } catch (error) {
      logger.error(`Error creating driver: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

