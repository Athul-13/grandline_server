import { injectable, inject } from 'tsyringe';
import { IGetPricingConfigUseCase } from '../../interface/pricing_config/get_pricing_config_use_case.interface';
import { IPricingConfigRepository } from '../../../../domain/repositories/pricing_config_repository.interface';
import { PricingConfigResponse } from '../../../dtos/pricing_config.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting the active pricing configuration
 * Returns the currently active pricing config or throws an error if none exists
 */
@injectable()
export class GetPricingConfigUseCase implements IGetPricingConfigUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IPricingConfigRepository)
    private readonly pricingConfigRepository: IPricingConfigRepository
  ) {}

  async execute(): Promise<PricingConfigResponse> {
    try {
      logger.info('Fetching active pricing configuration');

      const pricingConfig = await this.pricingConfigRepository.findActive();

      if (!pricingConfig) {
        logger.warn('No active pricing configuration found');
        throw new AppError(
          'No active pricing configuration found',
          'PRICING_CONFIG_NOT_FOUND',
          404
        );
      }

      const response: PricingConfigResponse = {
        pricingConfigId: pricingConfig.pricingConfigId,
        version: pricingConfig.version,
        fuelPrice: pricingConfig.fuelPrice,
        averageDriverPerHourRate: pricingConfig.averageDriverPerHourRate,
        taxPercentage: pricingConfig.taxPercentage,
        nightChargePerNight: pricingConfig.nightChargePerNight,
        isActive: pricingConfig.isActive,
        createdBy: pricingConfig.createdBy,
        createdAt: pricingConfig.createdAt,
        updatedAt: pricingConfig.updatedAt,
      };

      logger.info(`Active pricing configuration fetched: ${pricingConfig.pricingConfigId}, version: ${pricingConfig.version}`);
      return response;
    } catch (error) {
      logger.error(
        `Error fetching active pricing configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to fetch active pricing configuration',
        'PRICING_CONFIG_FETCH_ERROR',
        500
      );
    }
  }
}

