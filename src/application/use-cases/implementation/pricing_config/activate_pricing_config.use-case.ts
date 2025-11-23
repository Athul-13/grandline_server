import { injectable, inject } from 'tsyringe';
import { IActivatePricingConfigUseCase } from '../../interface/pricing_config/activate_pricing_config_use_case.interface';
import { IPricingConfigRepository } from '../../../../domain/repositories/pricing_config_repository.interface';
import { PricingConfigResponse } from '../../../dtos/pricing_config.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for activating a pricing configuration
 * Deactivates all existing configs and activates the specified one
 */
@injectable()
export class ActivatePricingConfigUseCase implements IActivatePricingConfigUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IPricingConfigRepository)
    private readonly pricingConfigRepository: IPricingConfigRepository
  ) {}

  async execute(pricingConfigId: string): Promise<PricingConfigResponse> {
    try {
      // Input validation
      if (!pricingConfigId || typeof pricingConfigId !== 'string' || pricingConfigId.trim().length === 0) {
        throw new AppError('Invalid pricing config ID', 'INVALID_PRICING_CONFIG_ID', 400);
      }

      logger.info(`Activating pricing config: ${pricingConfigId}`);

      // Validate pricing config exists
      const pricingConfig = await this.pricingConfigRepository.findById(pricingConfigId);

      if (!pricingConfig) {
        logger.warn(`Attempt to activate non-existent pricing config: ${pricingConfigId}`);
        throw new AppError('Pricing config not found', 'PRICING_CONFIG_NOT_FOUND', 404);
      }

      // Activate the pricing config (this deactivates all others first)
      await this.pricingConfigRepository.activate(pricingConfigId);

      // Fetch the updated config
      const activatedConfig = await this.pricingConfigRepository.findById(pricingConfigId);

      if (!activatedConfig) {
        throw new AppError('Failed to fetch activated pricing config', 'PRICING_CONFIG_FETCH_ERROR', 500);
      }

      logger.info(`Pricing config activated successfully: ${pricingConfigId}, version: ${activatedConfig.version}`);

      // Map to response DTO
      const response: PricingConfigResponse = {
        pricingConfigId: activatedConfig.pricingConfigId,
        version: activatedConfig.version,
        fuelPrice: activatedConfig.fuelPrice,
        averageDriverPerHourRate: activatedConfig.averageDriverPerHourRate,
        taxPercentage: activatedConfig.taxPercentage,
        nightChargePerNight: activatedConfig.nightChargePerNight,
        isActive: activatedConfig.isActive,
        createdBy: activatedConfig.createdBy,
        createdAt: activatedConfig.createdAt,
        updatedAt: activatedConfig.updatedAt,
      };

      return response;
    } catch (error) {
      logger.error(
        `Error activating pricing config ${pricingConfigId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to activate pricing config', 'PRICING_CONFIG_ACTIVATE_ERROR', 500);
    }
  }
}

