import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { IGetAdminTripsListUseCase } from '../../../application/use-cases/interface/admin/trip/get_admin_trips_list_use_case.interface';
import { IGetActiveTripLocationsUseCase } from '../../../application/use-cases/interface/admin/trip/get_active_trip_locations_use_case.interface';
import { TripState } from '../../../application/dtos/trip.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Admin trip controller
 * Handles admin trip management operations
 */
@injectable()
export class AdminTripController {
  constructor(
    @inject(USE_CASE_TOKENS.GetAdminTripsListUseCase)
    private readonly getAdminTripsListUseCase: IGetAdminTripsListUseCase,
    @inject(USE_CASE_TOKENS.GetActiveTripLocationsUseCase)
    private readonly getActiveTripLocationsUseCase: IGetActiveTripLocationsUseCase
  ) {}

  /**
   * Handles getting admin trips list
   */
  async getTripsList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const state = req.query.state as TripState | undefined;
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      logger.info(
        `Admin trips list request: page=${page}, limit=${limit}, state=${state || 'all'}, search=${search || 'none'}`
      );

      const response = await this.getAdminTripsListUseCase.execute(
        page,
        limit,
        state,
        search,
        sortBy,
        sortOrder
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching admin trips list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting active trip locations
   */
  async getActiveTripLocations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Admin active trip locations request');

      const locations = await this.getActiveTripLocationsUseCase.execute();

      sendSuccessResponse(res, HTTP_STATUS.OK, { locations });
    } catch (error) {
      logger.error(
        `Error fetching active trip locations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

