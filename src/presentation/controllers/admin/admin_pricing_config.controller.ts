import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { IGetPricingConfigUseCase } from '../../../application/use-cases/interface/pricing_config/get_pricing_config_use_case.interface';
import { ICreatePricingConfigUseCase } from '../../../application/use-cases/interface/pricing_config/create_pricing_config_use_case.interface';
import { IGetPricingConfigHistoryUseCase } from '../../../application/use-cases/interface/pricing_config/get_pricing_config_history_use_case.interface';
import { IActivatePricingConfigUseCase } from '../../../application/use-cases/interface/pricing_config/activate_pricing_config_use_case.interface';
import { CreatePricingConfigRequest } from '../../../application/dtos/pricing_config.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Admin pricing config controller
 * Handles admin pricing configuration management operations
 */
@injectable()
export class AdminPricingConfigController {
  constructor(
    @inject(USE_CASE_TOKENS.GetPricingConfigUseCase)
    private readonly getPricingConfigUseCase: IGetPricingConfigUseCase,
    @inject(USE_CASE_TOKENS.CreatePricingConfigUseCase)
    private readonly createPricingConfigUseCase: ICreatePricingConfigUseCase,
    @inject(USE_CASE_TOKENS.GetPricingConfigHistoryUseCase)
    private readonly getPricingConfigHistoryUseCase: IGetPricingConfigHistoryUseCase,
    @inject(USE_CASE_TOKENS.ActivatePricingConfigUseCase)
    private readonly activatePricingConfigUseCase: IActivatePricingConfigUseCase
  ) {}

  /**
   * Handles getting active pricing configuration
   * GET /api/v1/admin/pricing-config
   */
  async getActiveConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Admin request for active pricing configuration');

      const response = await this.getPricingConfigUseCase.execute();

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching active pricing config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles creating a new pricing configuration
   * POST /api/v1/admin/pricing-config
   */
  async createConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request = req.body as CreatePricingConfigRequest;
      const userId = req.user?.userId;

      if (!userId) {
        logger.error('User ID not found in authenticated request');
        sendErrorResponse(res, new Error('User ID not found'));
        return;
      }

      logger.info(`Admin creating new pricing config version by user: ${userId}`);

      const response = await this.createPricingConfigUseCase.execute(request, userId);

      logger.info(`Pricing config created successfully: ${response.pricingConfigId}, version: ${response.version}`);
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(
        `Error creating pricing config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting pricing configuration history
   * GET /api/v1/admin/pricing-config/history
   */
  async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Admin request for pricing configuration history');

      const response = await this.getPricingConfigHistoryUseCase.execute();

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching pricing config history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles activating a pricing configuration
   * PUT /api/v1/admin/pricing-config/:id/activate
   */
  async activateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`Admin request to activate pricing config: ${id}`);

      const response = await this.activatePricingConfigUseCase.execute(id);

      logger.info(`Pricing config activated successfully: ${id}, version: ${response.version}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error activating pricing config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

