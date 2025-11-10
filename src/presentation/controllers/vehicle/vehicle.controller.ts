import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ICreateVehicleUseCase } from '../../../application/use-cases/interface/vehicle/create_vehicle_use_case.interface';
import { IGetVehicleUseCase } from '../../../application/use-cases/interface/vehicle/get_vehicle_use_case.interface';
import { IGetAllVehiclesUseCase } from '../../../application/use-cases/interface/vehicle/get_all_vehicles_use_case.interface';
import { IGetVehiclesByTypeUseCase } from '../../../application/use-cases/interface/vehicle/get_vehicles_by_type_use_case.interface';
import { IUpdateVehicleUseCase } from '../../../application/use-cases/interface/vehicle/update_vehicle_use_case.interface';
import { IUpdateVehicleStatusUseCase } from '../../../application/use-cases/interface/vehicle/update_vehicle_status_use_case.interface';
import { IDeleteVehicleUseCase } from '../../../application/use-cases/interface/vehicle/delete_vehicle_use_case.interface';
import { IGetVehicleFilterOptionsUseCase } from '../../../application/use-cases/interface/vehicle/get_vehicle_filter_options_use_case.interface';
import { CreateVehicleRequest, UpdateVehicleRequest, UpdateVehicleStatusRequest } from '../../../application/dtos/vehicle.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Vehicle controller
 * Handles vehicle operations
 */
@injectable()
export class VehicleController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateVehicleUseCase)
    private readonly createVehicleUseCase: ICreateVehicleUseCase,
    @inject(USE_CASE_TOKENS.GetVehicleUseCase)
    private readonly getVehicleUseCase: IGetVehicleUseCase,
    @inject(USE_CASE_TOKENS.GetAllVehiclesUseCase)
    private readonly getAllVehiclesUseCase: IGetAllVehiclesUseCase,
    @inject(USE_CASE_TOKENS.GetVehiclesByTypeUseCase)
    private readonly getVehiclesByTypeUseCase: IGetVehiclesByTypeUseCase,
    @inject(USE_CASE_TOKENS.UpdateVehicleUseCase)
    private readonly updateVehicleUseCase: IUpdateVehicleUseCase,
    @inject(USE_CASE_TOKENS.UpdateVehicleStatusUseCase)
    private readonly updateVehicleStatusUseCase: IUpdateVehicleStatusUseCase,
    @inject(USE_CASE_TOKENS.DeleteVehicleUseCase)
    private readonly deleteVehicleUseCase: IDeleteVehicleUseCase,
    @inject(USE_CASE_TOKENS.GetVehicleFilterOptionsUseCase)
    private readonly getVehicleFilterOptionsUseCase: IGetVehicleFilterOptionsUseCase,
  ) {}

  /**
   * Handles creating vehicle
   */
  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateVehicleRequest = req.body;
      logger.info('Vehicle creation request');
      
      const response = await this.createVehicleUseCase.execute(request);
      
      logger.info('Vehicle created successfully');
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(`Error creating vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting vehicle by ID
   */
  async getVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`Vehicle fetch request for ID: ${id}`);
      
      const response = await this.getVehicleUseCase.execute(id);
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting all vehicles
   */
  async getAllVehicles(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Fetch all vehicles request');
      
      const response = await this.getAllVehiclesUseCase.execute();
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting vehicles by type
   */
  async getVehiclesByType(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleTypeId } = req.params;
      logger.info(`Fetch vehicles by type request for type: ${vehicleTypeId}`);
      
      const response = await this.getVehiclesByTypeUseCase.execute(vehicleTypeId);
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching vehicles by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating vehicle
   */
  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request: UpdateVehicleRequest = req.body;
      logger.info(`Vehicle update request for ID: ${id}`);
      
      const response = await this.updateVehicleUseCase.execute(id, request);
      
      logger.info(`Vehicle updated successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error updating vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating vehicle status
   */
  async updateVehicleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request: UpdateVehicleStatusRequest = req.body;
      logger.info(`Vehicle status update request for ID: ${id}`);
      
      const response = await this.updateVehicleStatusUseCase.execute(id, request);
      
      logger.info(`Vehicle status updated successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error updating vehicle status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles deleting vehicle
   */
  async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`Vehicle delete request for ID: ${id}`);
      
      await this.deleteVehicleUseCase.execute(id);
      
      logger.info(`Vehicle deleted successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, { message: 'Vehicle deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting vehicle filter options
   */
  async getFilterOptions(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Fetch vehicle filter options request');
      
      const response = await this.getVehicleFilterOptionsUseCase.execute();
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching filter options: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

