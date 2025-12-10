import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { IGetAdminReservationsListUseCase } from '../../../application/use-cases/interface/admin/reservation/get_admin_reservations_list_use_case.interface';
import { IGetAdminReservationUseCase } from '../../../application/use-cases/interface/admin/reservation/get_admin_reservation_use_case.interface';
import { IUpdateReservationStatusUseCase } from '../../../application/use-cases/interface/admin/reservation/update_reservation_status_use_case.interface';
import { IAddPassengersToReservationUseCase } from '../../../application/use-cases/interface/admin/reservation/add_passengers_to_reservation_use_case.interface';
import { IChangeReservationDriverUseCase } from '../../../application/use-cases/interface/admin/reservation/change_reservation_driver_use_case.interface';
import { IAdjustReservationVehiclesUseCase } from '../../../application/use-cases/interface/admin/reservation/adjust_reservation_vehicles_use_case.interface';
import { IUpdateReservationItineraryUseCase } from '../../../application/use-cases/interface/admin/reservation/update_reservation_itinerary_use_case.interface';
import { IProcessReservationRefundUseCase } from '../../../application/use-cases/interface/admin/reservation/process_reservation_refund_use_case.interface';
import { ICancelReservationUseCase } from '../../../application/use-cases/interface/admin/reservation/cancel_reservation_use_case.interface';
import { IAddReservationChargeUseCase } from '../../../application/use-cases/interface/admin/reservation/add_reservation_charge_use_case.interface';
import {
  UpdateReservationStatusRequest,
  AddPassengersToReservationRequest,
  ChangeReservationDriverRequest,
  AdjustReservationVehiclesRequest,
  UpdateReservationItineraryRequest,
  ProcessReservationRefundRequest,
  CancelReservationRequest,
  AddReservationChargeRequest,
} from '../../../application/dtos/admin_reservation.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, ReservationStatus } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Admin reservation controller
 * Handles admin reservation management operations
 */
@injectable()
export class AdminReservationController {
  constructor(
    @inject(USE_CASE_TOKENS.GetAdminReservationsListUseCase)
    private readonly getAdminReservationsListUseCase: IGetAdminReservationsListUseCase,
    @inject(USE_CASE_TOKENS.GetAdminReservationUseCase)
    private readonly getAdminReservationUseCase: IGetAdminReservationUseCase,
    @inject(USE_CASE_TOKENS.UpdateReservationStatusUseCase)
    private readonly updateReservationStatusUseCase: IUpdateReservationStatusUseCase,
    @inject(USE_CASE_TOKENS.AddPassengersToReservationUseCase)
    private readonly addPassengersToReservationUseCase: IAddPassengersToReservationUseCase,
    @inject(USE_CASE_TOKENS.ChangeReservationDriverUseCase)
    private readonly changeReservationDriverUseCase: IChangeReservationDriverUseCase,
    @inject(USE_CASE_TOKENS.AdjustReservationVehiclesUseCase)
    private readonly adjustReservationVehiclesUseCase: IAdjustReservationVehiclesUseCase,
    @inject(USE_CASE_TOKENS.UpdateReservationItineraryUseCase)
    private readonly updateReservationItineraryUseCase: IUpdateReservationItineraryUseCase,
    @inject(USE_CASE_TOKENS.ProcessReservationRefundUseCase)
    private readonly processReservationRefundUseCase: IProcessReservationRefundUseCase,
    @inject(USE_CASE_TOKENS.CancelReservationUseCase)
    private readonly cancelReservationUseCase: ICancelReservationUseCase,
    @inject(USE_CASE_TOKENS.AddReservationChargeUseCase)
    private readonly addReservationChargeUseCase: IAddReservationChargeUseCase
  ) {}

  /**
   * Handles getting admin reservations list
   */
  async getReservationsList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const status = req.query.status
        ? (Array.isArray(req.query.status)
            ? req.query.status
            : [req.query.status]
          ).map((s) => s as ReservationStatus)
        : undefined;
      const includeDeletedParam = req.query.includeDeleted;
      const includeDeleted =
        includeDeletedParam === 'true' ||
        includeDeletedParam === '1' ||
        (typeof includeDeletedParam === 'string' && includeDeletedParam.toLowerCase() === 'true');
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      logger.info(
        `Admin reservations list request: page=${page}, limit=${limit}, status=${status?.join(',') || 'all'}, includeDeleted=${includeDeleted}, search=${search || 'none'}`
      );

      const response = await this.getAdminReservationsListUseCase.execute(
        page,
        limit,
        status,
        includeDeleted,
        search,
        sortBy,
        sortOrder
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching admin reservations list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting admin reservation details
   */
  async getReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`Admin reservation details request for ID: ${id}`);

      const response = await this.getAdminReservationUseCase.execute(id);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching admin reservation details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating reservation status
   */
  async updateReservationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as UpdateReservationStatusRequest;
      const adminUserId = req.user?.userId || '';

      logger.info(`Admin updating reservation status: ${id}, status: ${request.status}`);

      const reservation = await this.updateReservationStatusUseCase.execute(
        id,
        request.status,
        adminUserId,
        request.reason
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, { reservation });
    } catch (error) {
      logger.error(
        `Error updating reservation status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles adding passengers to reservation
   */
  async addPassengers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as AddPassengersToReservationRequest;
      const adminUserId = req.user?.userId || '';

      logger.info(`Admin adding passengers to reservation: ${id}, count: ${request.passengers.length}`);

      const reservation = await this.addPassengersToReservationUseCase.execute(
        id,
        request.passengers,
        adminUserId
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, { reservation });
    } catch (error) {
      logger.error(
        `Error adding passengers to reservation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles changing reservation driver
   */
  async changeDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as ChangeReservationDriverRequest;
      const adminUserId = req.user?.userId || '';

      logger.info(`Admin changing driver for reservation: ${id}, driverId: ${request.driverId}`);

      const reservation = await this.changeReservationDriverUseCase.execute(
        id,
        request.driverId,
        adminUserId,
        request.reason
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, { reservation });
    } catch (error) {
      logger.error(
        `Error changing reservation driver: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles adjusting reservation vehicles
   */
  async adjustVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as AdjustReservationVehiclesRequest;
      const adminUserId = req.user?.userId || '';

      logger.info(`Admin adjusting vehicles for reservation: ${id}, vehicle count: ${request.vehicles.length}`);

      const reservation = await this.adjustReservationVehiclesUseCase.execute(
        id,
        request.vehicles,
        adminUserId
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, { reservation });
    } catch (error) {
      logger.error(
        `Error adjusting reservation vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating reservation itinerary
   */
  async updateItinerary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as UpdateReservationItineraryRequest;
      const adminUserId = req.user?.userId || '';

      logger.info(`Admin updating itinerary for reservation: ${id}, stop count: ${request.stops.length}`);

      const reservation = await this.updateReservationItineraryUseCase.execute(
        id,
        request.stops,
        adminUserId
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, { reservation });
    } catch (error) {
      logger.error(
        `Error updating reservation itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles processing reservation refund
   */
  async processRefund(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as ProcessReservationRefundRequest;
      const adminUserId = req.user?.userId || '';

      logger.info(`Admin processing refund for reservation: ${id}, amount: ${request.amount}`);

      const result = await this.processReservationRefundUseCase.execute(
        id,
        request.amount,
        adminUserId,
        request.reason
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, result);
    } catch (error) {
      logger.error(
        `Error processing reservation refund: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles cancelling reservation
   */
  async cancelReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as CancelReservationRequest;
      const adminUserId = req.user?.userId || '';

      logger.info(`Admin cancelling reservation: ${id}, reason: ${request.reason}`);

      const reservation = await this.cancelReservationUseCase.execute(
        id,
        request.reason,
        adminUserId
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, { reservation });
    } catch (error) {
      logger.error(
        `Error cancelling reservation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles adding charge to reservation
   */
  async addCharge(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as AddReservationChargeRequest;
      const adminUserId = req.user?.userId || '';

      logger.info(`Admin adding charge to reservation: ${id}, amount: ${request.amount}`);

      const charge = await this.addReservationChargeUseCase.execute(
        id,
        request.chargeType,
        request.description,
        request.amount,
        adminUserId,
        request.currency
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, { charge });
    } catch (error) {
      logger.error(
        `Error adding charge to reservation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

