import { PricingConfigHistoryResponse } from '../../../dtos/pricing_config.dto';

/**
 * Use case interface for getting pricing configuration history
 */
export interface IGetPricingConfigHistoryUseCase {
  execute(): Promise<PricingConfigHistoryResponse>;
}

