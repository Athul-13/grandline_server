import { Amenity } from '../../domain/entities/amenity.entity';
import {
  AmenityResponse,
  CreateAmenityResponse,
  GetAmenityResponse,
  UpdateAmenityResponse,
} from '../dtos/amenity.dto';
import { SUCCESS_MESSAGES } from '../../shared/constants';

/**
 * Mapper class for converting Amenity entities to response DTOs
 */
export class AmenityMapper {
  static toAmenityResponse(amenity: Amenity): AmenityResponse {
    return {
      amenityId: amenity.amenityId,
      name: amenity.name,
      price: amenity.price,
      createdAt: amenity.createdAt,
      updatedAt: amenity.updatedAt,
    };
  }

  static toCreateAmenityResponse(amenity: Amenity): CreateAmenityResponse {
    return {
      message: SUCCESS_MESSAGES.AMENITY_CREATED,
      amenity: this.toAmenityResponse(amenity),
    };
  }

  static toGetAmenityResponse(amenity: Amenity): GetAmenityResponse {
    return {
      amenity: this.toAmenityResponse(amenity),
    };
  }

  static toUpdateAmenityResponse(amenity: Amenity): UpdateAmenityResponse {
    return {
      message: SUCCESS_MESSAGES.AMENITY_UPDATED,
      amenity: this.toAmenityResponse(amenity),
    };
  }
}

