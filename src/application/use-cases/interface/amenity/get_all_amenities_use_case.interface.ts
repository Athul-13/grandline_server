import { GetAllAmenitiesResponse } from '../../../dtos/amenity.dto';

/**
 * Interface for getting all amenities use case
 */
export interface IGetAllAmenitiesUseCase {
  execute(page?: number, limit?: number): Promise<GetAllAmenitiesResponse>;
}

