import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IGetDashboardStatsUseCase } from '../../../application/use-cases/interface/dashboard/get_dashboard_stats_use_case.interface';
import { IGetRecentActivityUseCase } from '../../../application/use-cases/interface/dashboard/get_recent_activity_use_case.interface';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Dashboard controller
 * Handles dashboard-related operations for drivers
 */
@injectable()
export class DashboardController {
  constructor(
    @inject(USE_CASE_TOKENS.GetDashboardStatsUseCase)
    private readonly getDashboardStatsUseCase: IGetDashboardStatsUseCase,
    @inject(USE_CASE_TOKENS.GetRecentActivityUseCase)
    private readonly getRecentActivityUseCase: IGetRecentActivityUseCase
  ) {}

  /**
   * Handles getting dashboard statistics
   */
  async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get dashboard stats attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Get dashboard stats attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Dashboard stats fetch request for driver: ${driverId}`);
      const response = await this.getDashboardStatsUseCase.execute(driverId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting recent activity
   */
  async getRecentActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get recent activity attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Get recent activity attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Recent activity fetch request for driver: ${driverId}`);
      const response = await this.getRecentActivityUseCase.execute(driverId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching recent activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

