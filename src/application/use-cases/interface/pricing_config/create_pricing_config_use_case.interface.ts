import { CreatePricingConfigRequest, PricingConfigResponse } from '../../../dtos/pricing_config.dto';

/**
 * Use case interface for creating a new pricing configuration
 */
export interface ICreatePricingConfigUseCase {
  execute(request: CreatePricingConfigRequest, createdBy: string): Promise<PricingConfigResponse>;
}

