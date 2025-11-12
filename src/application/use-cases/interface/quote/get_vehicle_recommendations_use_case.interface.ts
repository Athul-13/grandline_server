import { GetRecommendationsRequest, VehicleRecommendationResponse } from '../../../dtos/quote.dto';

/**
 * Use case interface for getting vehicle recommendations
 */
export interface IGetVehicleRecommendationsUseCase {
  execute(request: GetRecommendationsRequest): Promise<VehicleRecommendationResponse>;
}

