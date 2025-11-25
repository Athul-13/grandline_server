import { injectable, inject } from 'tsyringe';
import { IGetPricingConfigHistoryUseCase } from '../../interface/pricing_config/get_pricing_config_history_use_case.interface';
import { IPricingConfigRepository } from '../../../../domain/repositories/pricing_config_repository.interface';
import { PricingConfigHistoryResponse, PricingConfigResponse } from '../../../dtos/pricing_config.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting pricing configuration history
 * Returns all pricing config versions ordered by version (newest first)
 */
@injectable()
export class GetPricingConfigHistoryUseCase implements IGetPricingConfigHistoryUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IPricingConfigRepository)
    private readonly pricingConfigRepository: IPricingConfigRepository
  ) {}

  async execute(): Promise<PricingConfigHistoryResponse> {
    try {
      logger.info('Fetching pricing configuration history');

      // Fetch all pricing configs ordered by version (descending)
      const pricingConfigs = await this.pricingConfigRepository.findAllOrderedByVersion();

      // Map to response DTOs
      const configsResponse: PricingConfigResponse[] = pricingConfigs.map((config) => ({
        pricingConfigId: config.pricingConfigId,
        version: config.version,
        fuelPrice: config.fuelPrice,
        averageDriverPerHourRate: config.averageDriverPerHourRate,
        taxPercentage: config.taxPercentage,
        nightChargePerNight: config.nightChargePerNight,
        isActive: config.isActive,
        createdBy: config.createdBy,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }));

      logger.info(`Pricing config history fetched: ${configsResponse.length} versions`);

      return {
        pricingConfigs: configsResponse,
      };
    } catch (error) {
      logger.error(
        `Error fetching pricing config history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to fetch pricing config history', 'PRICING_CONFIG_HISTORY_ERROR', 500);
    }
  }
}

