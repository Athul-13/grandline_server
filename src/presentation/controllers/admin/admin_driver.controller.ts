import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ICreateDriverUseCase } from '../../../application/use-cases/interface/driver/create_driver_use_case.interface';
import { IListDriversUseCase } from '../../../application/use-cases/interface/driver/list_drivers_use_case.interface';
import { IGetDriverByIdUseCase } from '../../../application/use-cases/interface/driver/get_driver_by_id_use_case.interface';
import { IUpdateDriverUseCase } from '../../../application/use-cases/interface/driver/update_driver_use_case.interface';
import { IUpdateDriverStatusUseCase } from '../../../application/use-cases/interface/driver/update_driver_status_use_case.interface';
import { IDeleteDriverUseCase } from '../../../application/use-cases/interface/driver/delete_driver_use_case.interface';
import { IGetDriverStatisticsUseCase } from '../../../application/use-cases/interface/driver/get_driver_statistics_use_case.interface';
import { CreateDriverRequest, ListDriversRequest, UpdateDriverRequest, UpdateDriverStatusRequest, GetDriverStatisticsRequest } from '../../../application/dtos/driver.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';
import { IRecordDriverPayoutUseCase } from '../../../application/use-cases/interface/driver/record_driver_payout_use_case.interface';

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
    @inject(USE_CASE_TOKENS.GetDriverByIdUseCase)
    private readonly getDriverByIdUseCase: IGetDriverByIdUseCase,
    @inject(USE_CASE_TOKENS.UpdateDriverUseCase)
    private readonly updateDriverUseCase: IUpdateDriverUseCase,
    @inject(USE_CASE_TOKENS.UpdateDriverStatusUseCase)
    private readonly updateDriverStatusUseCase: IUpdateDriverStatusUseCase,
    @inject(USE_CASE_TOKENS.DeleteDriverUseCase)
    private readonly deleteDriverUseCase: IDeleteDriverUseCase,
    @inject(USE_CASE_TOKENS.GetDriverStatisticsUseCase)
    private readonly getDriverStatisticsUseCase: IGetDriverStatisticsUseCase,
    @inject(USE_CASE_TOKENS.RecordDriverPayoutUseCase)
    private readonly recordDriverPayoutUseCase: IRecordDriverPayoutUseCase,
  ) {}

  /**
   * Handles creating a new driver
   * POST /api/v1/admin/drivers
   * Requires admin authentication
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
   * GET /api/v1/admin/drivers
   * Requires admin authentication
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

  /**
   * Handles getting driver details by ID
   * GET /api/v1/admin/drivers/:driverId
   * Requires admin authentication
   */
  async getDriverById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get driver by ID attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const driverId = req.params.driverId;
      if (!driverId) {
        logger.warn('Get driver by ID attempt without driverId parameter');
        sendErrorResponse(res, new Error('Driver ID is required'));
        return;
      }

      logger.info(`Admin ${req.user.userId} viewing driver: ${driverId}`);
      const response = await this.getDriverByIdUseCase.execute(driverId);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting driver by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating driver details
   * PUT /api/v1/admin/drivers/:driverId
   * Requires admin authentication
   */
  async updateDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Update driver attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const driverId = req.params.driverId;
      if (!driverId) {
        logger.warn('Update driver attempt without driverId parameter');
        sendErrorResponse(res, new Error('Driver ID is required'));
        return;
      }

      const request = req.body as UpdateDriverRequest;
      logger.info(`Admin ${req.user.userId} updating driver: ${driverId}`);
      const response = await this.updateDriverUseCase.execute(driverId, request);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.DRIVER_UPDATED);
    } catch (error) {
      logger.error(`Error updating driver: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating driver status
   * PUT /api/v1/admin/drivers/:driverId/status
   * Requires admin authentication
   */
  async updateDriverStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Update driver status attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const driverId = req.params.driverId;
      if (!driverId) {
        logger.warn('Update driver status attempt without driverId parameter');
        sendErrorResponse(res, new Error('Driver ID is required'));
        return;
      }

      const request = req.body as UpdateDriverStatusRequest;
      logger.info(`Admin ${req.user.userId} updating driver status: ${driverId} to ${request.status}`);
      const response = await this.updateDriverStatusUseCase.execute(driverId, request);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.DRIVER_STATUS_UPDATED);
    } catch (error) {
      logger.error(`Error updating driver status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles deleting a driver (soft delete)
   * DELETE /api/v1/admin/drivers/:driverId
   * Requires admin authentication
   */
  async deleteDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Delete driver attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const driverId = req.params.driverId;
      if (!driverId) {
        logger.warn('Delete driver attempt without driverId parameter');
        sendErrorResponse(res, new Error('Driver ID is required'));
        return;
      }

      logger.info(`Admin ${req.user.userId} deleting driver: ${driverId}`);
      const response = await this.deleteDriverUseCase.execute(driverId);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, response.message);
    } catch (error) {
      logger.error(`Error deleting driver: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting driver statistics
   * GET /api/v1/admin/drivers/:driverId/statistics
   * Requires authentication
   */
  async getDriverStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get driver statistics attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract query parameters
      const timeRange = req.query.timeRange as 'all_time' | '7_days' | '30_days' | 'custom' | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const request: GetDriverStatisticsRequest = {
        timeRange: timeRange || 'all_time',
        startDate,
        endDate,
      };

      logger.info(`Admin ${req.user.userId} fetching driver statistics: ${JSON.stringify(request)}`);
      const response = await this.getDriverStatisticsUseCase.execute(request);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting driver statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
 
  /**
   * Record Driver Payout
   * POST /api/v1/admin/drivers/:driverId/payout
   * Requires admin authentication
   */
  async recordDriverPayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Record driver payout attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      } 

      const driverId = req.params.driverId;
      if (!driverId) {
        logger.warn('Record driver payout attempt without driverId parameter');
        sendErrorResponse(res, new Error('Driver ID is required'));
        return;
      }

      const request = req.body as { paymentDate: string | Date };
      if (!request.paymentDate) {
        logger.warn('Record driver payout attempt without paymentDate');
        sendErrorResponse(res, new Error('Payment date is required'));
        return;
      }

      // Convert paymentDate to Date object if it's a string
      const paymentDate = request.paymentDate instanceof Date 
        ? request.paymentDate 
        : new Date(request.paymentDate);

      // Validate date
      if (isNaN(paymentDate.getTime())) {
        logger.warn('Record driver payout attempt with invalid paymentDate');
        sendErrorResponse(res, new Error('Invalid payment date format'));
        return;
      }

      logger.info(`Admin ${req.user.userId} recording payout for driver: ${driverId}, paymentDate: ${paymentDate.toISOString()}`);

      await this.recordDriverPayoutUseCase.execute(driverId, paymentDate);

      logger.info(`Payout recorded successfully for driver: ${driverId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, { message: 'Driver payout recorded successfully' }, 'Driver payout recorded successfully');
    } catch (error) {
      logger.error(`Error recording driver payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

