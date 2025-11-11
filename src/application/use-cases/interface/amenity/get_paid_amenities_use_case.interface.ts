import { GetPaidAmenitiesResponse } from '../../../dtos/amenity.dto';

/**
 * Interface for getting paid amenities use case
 */
export interface IGetPaidAmenitiesUseCase {
  execute(page?: number, limit?: number): Promise<GetPaidAmenitiesResponse>;
}

