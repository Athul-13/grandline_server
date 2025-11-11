import { UpdateAmenityRequest, UpdateAmenityResponse } from '../../../dtos/amenity.dto';

/**
 * Interface for updating amenity use case
 */
export interface IUpdateAmenityUseCase {
  execute(id: string, request: UpdateAmenityRequest): Promise<UpdateAmenityResponse>;
}

