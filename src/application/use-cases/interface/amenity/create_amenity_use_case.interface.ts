import { CreateAmenityRequest, CreateAmenityResponse } from '../../../dtos/amenity.dto';

/**
 * Interface for creating amenity use case
 */
export interface ICreateAmenityUseCase {
  execute(request: CreateAmenityRequest): Promise<CreateAmenityResponse>;
}

