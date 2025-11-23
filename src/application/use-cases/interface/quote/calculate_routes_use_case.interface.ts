import { CalculateRoutesRequest, RouteCalculationResponse } from '../../../dtos/quote.dto';

/**
 * Use case interface for calculating routes
 */
export interface ICalculateRoutesUseCase {
  execute(quoteId: string, request: CalculateRoutesRequest, userId: string): Promise<RouteCalculationResponse>;
}

