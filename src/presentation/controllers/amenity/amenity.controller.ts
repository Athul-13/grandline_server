import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ICreateAmenityUseCase } from '../../../application/use-cases/interface/amenity/create_amenity_use_case.interface';
import { IGetAmenityUseCase } from '../../../application/use-cases/interface/amenity/get_amenity_use_case.interface';
import { IGetAllAmenitiesUseCase } from '../../../application/use-cases/interface/amenity/get_all_amenities_use_case.interface';
import { IGetPaidAmenitiesUseCase } from '../../../application/use-cases/interface/amenity/get_paid_amenities_use_case.interface';
import { IUpdateAmenityUseCase } from '../../../application/use-cases/interface/amenity/update_amenity_use_case.interface';
import { IDeleteAmenityUseCase } from '../../../application/use-cases/interface/amenity/delete_amenity_use_case.interface';
import { CreateAmenityRequest, UpdateAmenityRequest } from '../../../application/dtos/amenity.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Amenity controller
 * Handles amenity operations
 */
@injectable()
export class AmenityController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateAmenityUseCase)
    private readonly createAmenityUseCase: ICreateAmenityUseCase,
    @inject(USE_CASE_TOKENS.GetAmenityUseCase)
    private readonly getAmenityUseCase: IGetAmenityUseCase,
    @inject(USE_CASE_TOKENS.GetAllAmenitiesUseCase)
    private readonly getAllAmenitiesUseCase: IGetAllAmenitiesUseCase,
    @inject(USE_CASE_TOKENS.GetPaidAmenitiesUseCase)
    private readonly getPaidAmenitiesUseCase: IGetPaidAmenitiesUseCase,
    @inject(USE_CASE_TOKENS.UpdateAmenityUseCase)
    private readonly updateAmenityUseCase: IUpdateAmenityUseCase,
    @inject(USE_CASE_TOKENS.DeleteAmenityUseCase)
    private readonly deleteAmenityUseCase: IDeleteAmenityUseCase,
  ) {}

  /**
   * Handles creating amenity
   */
  async createAmenity(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as CreateAmenityRequest;
      logger.info('Amenity creation request');
      
      const response = await this.createAmenityUseCase.execute(request);
      
      logger.info('Amenity created successfully');
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(`Error creating amenity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting amenity by ID
   */
  async getAmenity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`Amenity fetch request for ID: ${id}`);
      
      const response = await this.getAmenityUseCase.execute(id);
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching amenity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting all amenities
   */
  async getAllAmenities(req: Request, res: Response): Promise<void> {
    try {
      // Extract pagination parameters from query string
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      logger.info(`Fetch all amenities request - page: ${page || 'default'}, limit: ${limit || 'default'}`);
      
      const response = await this.getAllAmenitiesUseCase.execute(page, limit);
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching amenities: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting paid amenities (for reservations)
   */
  async getPaidAmenities(req: Request, res: Response): Promise<void> {
    try {
      // Extract pagination parameters from query string
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      logger.info(`Fetch paid amenities request - page: ${page || 'default'}, limit: ${limit || 'default'}`);
      
      const response = await this.getPaidAmenitiesUseCase.execute(page, limit);
      
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching paid amenities: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating amenity
   */
  async updateAmenity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as UpdateAmenityRequest;
      logger.info(`Amenity update request for ID: ${id}`);
      
      const response = await this.updateAmenityUseCase.execute(id, request);
      
      logger.info(`Amenity updated successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error updating amenity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles deleting amenity
   */
  async deleteAmenity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`Amenity delete request for ID: ${id}`);
      
      await this.deleteAmenityUseCase.execute(id);
      
      logger.info(`Amenity deleted successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, { message: 'Amenity deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting amenity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

