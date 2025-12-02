import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ICreateDriverUseCase } from '../../../application/use-cases/interface/driver/create_driver_use_case.interface';
import { IListDriversUseCase } from '../../../application/use-cases/interface/driver/list_drivers_use_case.interface';
import { CreateDriverRequest, ListDriversRequest } from '../../../application/dtos/driver.dto';
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
    @inject(USE_CASE_TOKENS.ListDriversUseCase)
    private readonly listDriversUseCase: IListDriversUseCase,
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

  /**
   * Handles listing drivers with pagination, filtering, and search
   */
  async listDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('List drivers attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract query parameters
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const status = req.query.status
        ? (Array.isArray(req.query.status)
            ? req.query.status
            : [req.query.status]
          ).map((s) => s as string)
        : undefined;
      const isOnboardedParam = req.query.isOnboarded;
      const isOnboarded =
        isOnboardedParam !== undefined
          ? isOnboardedParam === 'true' || isOnboardedParam === '1' || (typeof isOnboardedParam === 'string' && isOnboardedParam.toLowerCase() === 'true')
          : undefined;
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const request: ListDriversRequest = {
        page,
        limit,
        status,
        isOnboarded,
        search,
        sortBy,
        sortOrder,
      };

      logger.info(`Admin ${req.user.userId} listing drivers with filters: ${JSON.stringify(request)}`);
      const response = await this.listDriversUseCase.execute(request);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error listing drivers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

