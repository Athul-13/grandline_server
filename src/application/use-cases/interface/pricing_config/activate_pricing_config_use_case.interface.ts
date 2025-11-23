import { PricingConfigResponse } from '../../../dtos/pricing_config.dto';

/**
 * Use case interface for activating a pricing configuration
 */
export interface IActivatePricingConfigUseCase {
  execute(pricingConfigId: string): Promise<PricingConfigResponse>;
}

