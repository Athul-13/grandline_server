import { PricingBreakdownResponse } from '../../../dtos/quote.dto';

/**
 * Use case interface for calculating quote pricing
 */
export interface ICalculateQuotePricingUseCase {
  execute(quoteId: string, userId: string): Promise<PricingBreakdownResponse>;
}

