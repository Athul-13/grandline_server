import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { VehicleFilter } from '../../../domain/repositories/vehicle_filter.interface';
import { VehicleStatus } from '../../../shared/constants';
import { ICreateVehicleUseCase } from '../../../application/use-cases/interface/vehicle/create_vehicle_use_case.interface';
import { IGetVehicleUseCase } from '../../../application/use-cases/interface/vehicle/get_vehicle_use_case.interface';
import { IGetAllVehiclesUseCase } from '../../../application/use-cases/interface/vehicle/get_all_vehicles_use_case.interface';
import { IGetVehiclesByTypeUseCase } from '../../../application/use-cases/interface/vehicle/get_vehicles_by_type_use_case.interface';
import { IUpdateVehicleUseCase } from '../../../application/use-cases/interface/vehicle/update_vehicle_use_case.interface';
import { IUpdateVehicleStatusUseCase } from '../../../application/use-cases/interface/vehicle/update_vehicle_status_use_case.interface';
import { IDeleteVehicleUseCase } from '../../../application/use-cases/interface/vehicle/delete_vehicle_use_case.interface';
import { IGetVehicleFilterOptionsUseCase } from '../../../application/use-cases/interface/vehicle/get_vehicle_filter_options_use_case.interface';
import { IGenerateVehicleImageUploadUrlUseCase } from '../../../application/use-cases/interface/vehicle/generate_vehicle_image_upload_url_use_case.interface';
import { IDeleteVehicleImagesUseCase } from '../../../application/use-cases/interface/vehicle/delete_vehicle_images_use_case.interface';
import { CreateVehicleRequest, UpdateVehicleRequest, UpdateVehicleStatusRequest, DeleteVehicleImagesRequest } from '../../../application/dtos/vehicle.dto';
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
    @inject(USE_CASE_TOKENS.GenerateVehicleImageUploadUrlUseCase)
    private readonly generateVehicleImageUploadUrlUseCase: IGenerateVehicleImageUploadUrlUseCase,
    @inject(USE_CASE_TOKENS.DeleteVehicleImagesUseCase)
    private readonly deleteVehicleImagesUseCase: IDeleteVehicleImagesUseCase,
  ) {}

  /**
   * Handles creating vehicle
   */
  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as CreateVehicleRequest;
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
   * Handles getting all vehicles with pagination, sorting, and filtering
   */
  async getAllVehicles(req: Request, res: Response): Promise<void> {
    try {
      // Extract pagination parameters from query string
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
      // Extract sorting parameters from query string
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      // Extract filter parameters from query string
      const filter: VehicleFilter = {};
      
      // Handle status filter - can be single value or array
      if (req.query.status) {
        const statusParam = req.query.status;
        filter.status = Array.isArray(statusParam) 
          ? statusParam as VehicleStatus[]
          : [statusParam as VehicleStatus];
      }

      // Handle base fare range filters
      if (req.query.baseFare_min) {
        filter.baseFareMin = parseInt(req.query.baseFare_min as string, 10);
      }
      if (req.query.baseFare_max) {
        filter.baseFareMax = parseInt(req.query.baseFare_max as string, 10);
      }

      // Handle capacity filter
      if (req.query.capacity) {
        filter.capacity = parseInt(req.query.capacity as string, 10);
      }

      // Handle year range filters
      if (req.query.year_min) {
        filter.yearMin = parseInt(req.query.year_min as string, 10);
      }
      if (req.query.year_max) {
        filter.yearMax = parseInt(req.query.year_max as string, 10);
      }

      // Handle search parameter
      if (req.query.search) {
        const searchTerm = (req.query.search as string).trim();
        if (searchTerm.length > 0) {
          filter.search = searchTerm;
        }
      }

      // Only include filter if it has at least one property
      const hasFilters = Object.keys(filter).length > 0;
      const appliedFilter = hasFilters ? filter : undefined;

      logger.info(`Fetch all vehicles request - page: ${page || 'default'}, limit: ${limit || 'default'}, sortBy: ${sortBy || 'default'}, sortOrder: ${sortOrder || 'default'}, search: ${filter.search || 'none'}, filters: ${appliedFilter ? JSON.stringify(appliedFilter) : 'none'}`);
      
      const response = await this.getAllVehiclesUseCase.execute(page, limit, sortBy, sortOrder, appliedFilter);
      
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
      const request = req.body as UpdateVehicleRequest;
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
      const request = req.body as UpdateVehicleStatusRequest;
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

  /**
   * Handles generating signed upload URL for vehicle images
   */
  async generateImageUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Generate vehicle image upload URL request');
      
      const response = await this.generateVehicleImageUploadUrlUseCase.execute();
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error generating upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles deleting vehicle images from Cloudinary
   */
  async deleteImages(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as DeleteVehicleImagesRequest;
      logger.info(`Delete vehicle images request for ${request.urls.length} image(s)`);
      
      await this.deleteVehicleImagesUseCase.execute(request.urls);
      
      logger.info(`Vehicle images deleted successfully`);
      sendSuccessResponse(res, HTTP_STATUS.OK, { message: 'Vehicle images deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting vehicle images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

