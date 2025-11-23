import { injectable, inject } from 'tsyringe';
import { ICreatePricingConfigUseCase } from '../../interface/pricing_config/create_pricing_config_use_case.interface';
import { IPricingConfigRepository } from '../../../../domain/repositories/pricing_config_repository.interface';
import { CreatePricingConfigRequest, PricingConfigResponse } from '../../../dtos/pricing_config.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { PricingConfig } from '../../../../domain/entities/pricing_config.entity';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for creating a new pricing configuration
 * Creates a new version of pricing config with auto-incremented version number
 */
@injectable()
export class CreatePricingConfigUseCase implements ICreatePricingConfigUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IPricingConfigRepository)
    private readonly pricingConfigRepository: IPricingConfigRepository
  ) {}

  async execute(request: CreatePricingConfigRequest, createdBy: string): Promise<PricingConfigResponse> {
    try {
      // Input validation
      if (!request) {
        throw new AppError('Invalid request', 'INVALID_REQUEST', 400);
      }

      if (!createdBy || typeof createdBy !== 'string' || createdBy.trim().length === 0) {
        throw new AppError('Invalid createdBy user ID', 'INVALID_USER_ID', 400);
      }

      // Validate numeric fields are positive
      if (request.fuelPrice < 0) {
        throw new AppError('Fuel price must be a positive number', 'INVALID_FUEL_PRICE', 400);
      }

      if (request.averageDriverPerHourRate < 0) {
        throw new AppError('Average driver per hour rate must be a positive number', 'INVALID_DRIVER_RATE', 400);
      }

      if (request.taxPercentage < 0 || request.taxPercentage > 100) {
        throw new AppError('Tax percentage must be between 0 and 100', 'INVALID_TAX_PERCENTAGE', 400);
      }

      if (request.nightChargePerNight < 0) {
        throw new AppError('Night charge per night must be a positive number', 'INVALID_NIGHT_CHARGE', 400);
      }

      logger.info(`Creating new pricing config version by user: ${createdBy}`);

      // Get latest version number
      const latestVersion = await this.pricingConfigRepository.findLatestVersion();
      const newVersion = latestVersion + 1;

      // Generate pricing config ID
      const pricingConfigId = randomUUID();
      const now = new Date();

      // Create new pricing config entity
      const pricingConfig = new PricingConfig(
        pricingConfigId,
        newVersion,
        request.fuelPrice,
        request.averageDriverPerHourRate,
        request.taxPercentage,
        request.nightChargePerNight,
        false, // isActive - must be activated separately
        createdBy.trim(),
        now,
        now
      );

      // Validate entity
      if (!pricingConfig.hasValidPrices()) {
        throw new AppError('Invalid pricing values', 'INVALID_PRICING_VALUES', 400);
      }

      if (!pricingConfig.hasValidTaxPercentage()) {
        throw new AppError('Invalid tax percentage', 'INVALID_TAX_PERCENTAGE', 400);
      }

      // Save to repository
      await this.pricingConfigRepository.create(pricingConfig);

      logger.info(`Pricing config created: ${pricingConfigId}, version: ${newVersion}`);

      // Map to response DTO
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

      return response;
    } catch (error) {
      logger.error(
        `Error creating pricing config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to create pricing config', 'PRICING_CONFIG_CREATE_ERROR', 500);
    }
  }
}

