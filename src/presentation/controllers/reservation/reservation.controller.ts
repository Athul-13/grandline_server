import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';
import { IGetReservationUseCase } from '../../../application/use-cases/interface/reservation/get_reservation_use_case.interface';
import { IGetReservationsListUseCase } from '../../../application/use-cases/interface/reservation/get_reservations_list_use_case.interface';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';

/**
 * Reservation controller
 * Handles reservation-related operations
 */
@injectable()
export class ReservationController {
  constructor(
    @inject(USE_CASE_TOKENS.GetReservationUseCase)
    private readonly getReservationUseCase: IGetReservationUseCase,
    @inject(USE_CASE_TOKENS.GetReservationsListUseCase)
    private readonly getReservationsListUseCase: IGetReservationsListUseCase
  ) {}

  /**
   * Handles getting a reservation by ID
   */
  async getReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Reservation fetch request for ID: ${id} by user: ${userId}`);

      const response = await this.getReservationUseCase.execute(id, userId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching reservation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting reservations list
   */
  async getReservationsList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Extract optional dropdown parameter for support modal
      const forDropdown = req.query.forDropdown === 'true' || req.query.forDropdown === '1';

      logger.info(`Reservations list request by user: ${userId}, page: ${page}, limit: ${limit}, forDropdown: ${forDropdown}`);

      const response = await this.getReservationsListUseCase.execute(userId, page, limit, forDropdown);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching reservations list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

