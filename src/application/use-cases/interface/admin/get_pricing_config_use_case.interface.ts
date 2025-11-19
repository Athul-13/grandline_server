import { PricingConfigResponse } from '../../../dtos/pricing_config.dto';

/**
 * Use case interface for getting the active pricing configuration
 */
export interface IGetPricingConfigUseCase {
  execute(): Promise<PricingConfigResponse>;
}

