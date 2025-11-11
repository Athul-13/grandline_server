import { GetAmenityResponse } from '../../../dtos/amenity.dto';

/**
 * Interface for getting amenity use case
 */
export interface IGetAmenityUseCase {
  execute(id: string): Promise<GetAmenityResponse>;
}

