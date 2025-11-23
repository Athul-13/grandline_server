import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ICreateVehicleTypeUseCase } from '../../../application/use-cases/interface/vehicle_type/create_vehicle_type_use_case.interface';
import { IGetVehicleTypeUseCase } from '../../../application/use-cases/interface/vehicle_type/get_vehicle_type_use_case.interface';
import { IGetAllVehicleTypesUseCase } from '../../../application/use-cases/interface/vehicle_type/get_all_vehicle_types_use_case.interface';
import { IUpdateVehicleTypeUseCase } from '../../../application/use-cases/interface/vehicle_type/update_vehicle_type_use_case.interface';
import { IDeleteVehicleTypeUseCase } from '../../../application/use-cases/interface/vehicle_type/delete_vehicle_type_use_case.interface';
import { CreateVehicleTypeRequest, UpdateVehicleTypeRequest } from '../../../application/dtos/vehicle.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * VehicleType controller
 * Handles vehicle type operations
 */
@injectable()
export class VehicleTypeController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateVehicleTypeUseCase)
    private readonly createVehicleTypeUseCase: ICreateVehicleTypeUseCase,
    @inject(USE_CASE_TOKENS.GetVehicleTypeUseCase)
    private readonly getVehicleTypeUseCase: IGetVehicleTypeUseCase,
    @inject(USE_CASE_TOKENS.GetAllVehicleTypesUseCase)
    private readonly getAllVehicleTypesUseCase: IGetAllVehicleTypesUseCase,
    @inject(USE_CASE_TOKENS.UpdateVehicleTypeUseCase)
    private readonly updateVehicleTypeUseCase: IUpdateVehicleTypeUseCase,
    @inject(USE_CASE_TOKENS.DeleteVehicleTypeUseCase)
    private readonly deleteVehicleTypeUseCase: IDeleteVehicleTypeUseCase,
  ) {}

  /**
   * Handles creating vehicle type
   */
  async createVehicleType(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as CreateVehicleTypeRequest;
      logger.info('Vehicle type creation request');
      
      const response = await this.createVehicleTypeUseCase.execute(request);
      
      logger.info('Vehicle type created successfully');
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(`Error creating vehicle type: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting vehicle type by ID
   */
  async getVehicleType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`Vehicle type fetch request for ID: ${id}`);
      
      const response = await this.getVehicleTypeUseCase.execute(id);
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching vehicle type: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting all vehicle types with pagination
   */
  async getAllVehicleTypes(req: Request, res: Response): Promise<void> {
    try {
      // Extract pagination parameters from query string
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      logger.info(`Fetch all vehicle types request - page: ${page || 'default'}, limit: ${limit || 'default'}`);
      
      const response = await this.getAllVehicleTypesUseCase.execute(page, limit);
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching vehicle types: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating vehicle type
   */
  async updateVehicleType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as UpdateVehicleTypeRequest;
      logger.info(`Vehicle type update request for ID: ${id}`);
      
      const response = await this.updateVehicleTypeUseCase.execute(id, request);
      
      logger.info(`Vehicle type updated successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error updating vehicle type: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles deleting vehicle type
   */
  async deleteVehicleType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`Vehicle type delete request for ID: ${id}`);
      
      await this.deleteVehicleTypeUseCase.execute(id);
      
      logger.info(`Vehicle type deleted successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, { message: 'Vehicle type deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting vehicle type: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

