import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, MinLength, MaxLength, ValidateIf, Matches, IsArray, ArrayMinSize } from 'class-validator';

/**
 * Request DTO for creating amenity
 * Validates input data before processing
 */
export class CreateAmenityRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/.*\S.*/, {
    message: 'Name must contain at least one non-whitespace character',
  })
  name!: string;

  @IsOptional()
  @ValidateIf((o) => o.price !== undefined && o.price !== null)
  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price?: number | null;
}

/**
 * Request DTO for updating amenity
 * All fields are optional - only provided fields will be updated
 */
export class UpdateAmenityRequest {
  @IsOptional()
  @ValidateIf((o) => o.name !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/.*\S.*/, {
    message: 'Name must contain at least one non-whitespace character',
  })
  name?: string;

  @IsOptional()
  @ValidateIf((o) => o.price !== undefined && o.price !== null)
  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price?: number | null;
}

/**
 * Response DTO for amenity
 * Contains amenity information
 */
export interface AmenityResponse {
  amenityId: string;
  name: string;
  price: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for creating amenity
 * Contains the result of the amenity creation process
 */
export interface CreateAmenityResponse {
  message: string;
  amenity: AmenityResponse;
}

/**
 * Response DTO for getting amenity
 * Contains amenity information
 */
export interface GetAmenityResponse {
  amenity: AmenityResponse;
}

/**
 * Response DTO for getting all amenities with pagination
 * Contains paginated amenities and pagination metadata
 */
export interface GetAllAmenitiesResponse {
  data: AmenityResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response DTO for getting paid amenities with pagination
 * Contains paginated paid amenities and pagination metadata
 */
export interface GetPaidAmenitiesResponse {
  data: AmenityResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response DTO for updating amenity
 * Contains the result of the amenity update process
 */
export interface UpdateAmenityResponse {
  message: string;
  amenity: AmenityResponse;
}


