import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, IsUrl, Min, Max, MinLength, MaxLength, ValidateIf, Matches, ArrayMinSize } from 'class-validator';
import { VehicleStatus } from '../../shared/constants';

/**
 * Request DTO for creating vehicle type
 * Validates input data before processing
 */
export class CreateVehicleTypeRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/.*\S.*/, {
    message: 'Name must contain at least one non-whitespace character',
  })
  name!: string;

  @IsOptional()
  @ValidateIf((o: CreateVehicleTypeRequest) => o.description !== undefined)
  @IsString()
  @Matches(/.*\S.*/, {
    message: 'Description must contain at least one non-whitespace character if provided',
  })
  description?: string;
}

/**
 * Request DTO for updating vehicle type
 * All fields are optional - only provided fields will be updated
 */
export class UpdateVehicleTypeRequest {
  @IsOptional()
  @ValidateIf((o: UpdateVehicleTypeRequest) => o.name !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/.*\S.*/, {
    message: 'Name must contain at least one non-whitespace character',
  })
  name?: string;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleTypeRequest) => o.description !== undefined)
  @IsString()
  @Matches(/.*\S.*/, {
    message: 'Description must contain at least one non-whitespace character if provided',
  })
  description?: string;
}

/**
 * Request DTO for creating vehicle
 * Validates input data before processing
 */
export class CreateVehicleRequest {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\S+$/, {
    message: 'Vehicle type ID must not contain whitespace',
  })
  vehicleTypeId!: string;

  @IsNumber()
  @Min(1)
  capacity!: number;

  @IsNumber()
  @Min(0)
  baseFare!: number;

  @IsNumber()
  @Min(0)
  maintenance!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Matches(/.*\S.*/, {
    message: 'Plate number must contain at least one non-whitespace character',
  })
  plateNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Matches(/.*\S.*/, {
    message: 'Vehicle model must contain at least one non-whitespace character',
  })
  vehicleModel!: string;

  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsNumber()
  @Min(0)
  fuelConsumption!: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Image URLs array must contain at least one URL if provided' })
  @IsUrl({}, { each: true, message: 'Each image URL must be a valid URL' })
  imageUrls?: string[];

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each amenity ID must be a string' })
  @Matches(/^\S+$/, { each: true, message: 'Each amenity ID must not contain whitespace' })
  amenityIds?: string[];
}

/**
 * Request DTO for updating vehicle
 * All fields are optional - only provided fields will be updated
 */
export class UpdateVehicleRequest {
  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.vehicleTypeId !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\S+$/, {
    message: 'Vehicle type ID must not contain whitespace',
  })
  vehicleTypeId?: string;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.capacity !== undefined)
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.baseFare !== undefined)
  @IsNumber()
  @Min(0)
  baseFare?: number;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.maintenance !== undefined)
  @IsNumber()
  @Min(0)
  maintenance?: number;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.plateNumber !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Matches(/.*\S.*/, {
    message: 'Plate number must contain at least one non-whitespace character',
  })
  plateNumber?: string;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.vehicleModel !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Matches(/.*\S.*/, {
    message: 'Vehicle model must contain at least one non-whitespace character',
  })
  vehicleModel?: string;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.year !== undefined)
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.fuelConsumption !== undefined)
  @IsNumber()
  @Min(0)
  fuelConsumption?: number;

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.imageUrls !== undefined)
  @IsArray()
  @ArrayMinSize(1, { message: 'Image URLs array must contain at least one URL if provided' })
  @IsUrl({}, { each: true, message: 'Each image URL must be a valid URL' })
  imageUrls?: string[];

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.amenityIds !== undefined)
  @IsArray()
  @IsString({ each: true, message: 'Each amenity ID must be a string' })
  @Matches(/^\S+$/, { each: true, message: 'Each amenity ID must not contain whitespace' })
  amenityIds?: string[];

  @IsOptional()
  @ValidateIf((o: UpdateVehicleRequest) => o.status !== undefined)
  @IsEnum(VehicleStatus, { message: 'Status must be a valid vehicle status' })
  status?: VehicleStatus;
}

/**
 * Request DTO for updating vehicle status
 * Validates input data before processing
 */
export class UpdateVehicleStatusRequest {
  @IsEnum(VehicleStatus)
  @IsNotEmpty()
  status!: VehicleStatus;
}

/**
 * Response DTO for vehicle type
 * Contains vehicle type information
 */
export interface VehicleTypeResponse {
  vehicleTypeId: string;
  name: string;
  description: string;
  vehicleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pagination metadata
 * Contains pagination information for paginated responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Response DTO for getting all vehicle types with pagination
 * Contains paginated vehicle types and pagination metadata
 */
export interface GetAllVehicleTypesResponse {
  data: VehicleTypeResponse[];
  pagination: PaginationMeta;
}

/**
 * Response DTO for creating vehicle type
 * Contains the result of the vehicle type creation process
 */
export interface CreateVehicleTypeResponse {
  message: string;
  vehicleType: VehicleTypeResponse;
}

/**
 * Response DTO for vehicle
 * Contains vehicle information
 */
export interface VehicleResponse {
  vehicleId: string;
  vehicleType: VehicleTypeResponse;
  capacity: number;
  baseFare: number;
  maintenance: number;
  plateNumber: string;
  vehicleModel: string;
  year: number;
  fuelConsumption: number;
  imageUrls?: string[];
  status: VehicleStatus;
  amenityIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for creating vehicle
 * Contains the result of the vehicle creation process
 */
export interface CreateVehicleResponse {
  message: string;
  vehicle: VehicleResponse;
}

/**
 * Response DTO for getting vehicle
 * Contains vehicle information
 */
export interface GetVehicleResponse {
  vehicle: VehicleResponse;
}

/**
 * Response DTO for getting all vehicles with pagination
 * Contains paginated vehicles and pagination metadata
 */
/**
 * Filter DTO for vehicle queries
 * Validates filter parameters from query string
 */
export class VehicleFilterDto {
  @IsOptional()
  @IsArray()
  @IsEnum(VehicleStatus, { each: true, message: 'Each status must be a valid vehicle status' })
  status?: VehicleStatus[];

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'baseFare_min must be greater than or equal to 0' })
  baseFare_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'baseFare_max must be greater than or equal to 0' })
  baseFare_max?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'capacity must be greater than or equal to 1' })
  capacity?: number; // Minimum capacity (vehicles with capacity >= this value)

  @IsOptional()
  @IsNumber()
  @Min(1900, { message: 'year_min must be greater than or equal to 1900' })
  year_min?: number; // Minimum year (vehicles with year >= this value)

  @IsOptional()
  @IsNumber()
  @Min(1900, { message: 'year_max must be greater than or equal to 1900' })
  year_max?: number; // Maximum year (vehicles with year <= this value)
}

export interface GetAllVehiclesResponse {
  data: VehicleResponse[];
  pagination: PaginationMeta;
}

/**
 * Response DTO for getting vehicles by type
 * Contains list of vehicles
 */
export interface GetVehiclesByTypeResponse {
  vehicles: VehicleResponse[];
}

/**
 * Response DTO for updating vehicle
 * Contains the result of the vehicle update process
 */
export interface UpdateVehicleResponse {
  message: string;
  vehicle: VehicleResponse;
}

/**
 * Response DTO for updating vehicle status
 * Contains the result of the vehicle status update process
 */
export interface UpdateVehicleStatusResponse {
  message: string;
  vehicle: VehicleResponse;
}

/**
 * Response DTO for deleting vehicle
 * Contains the result of the vehicle deletion process
 */
export interface DeleteVehicleResponse {
  message: string;
}

/**
 * Filter type enumeration
 * Defines the types of filters supported by the client
 */
export type FilterType = 'checkbox' | 'range' | 'number' | 'select';

/**
 * Base interface for all filter options
 * Contains common properties shared by all filter types
 */
interface BaseFilterOption {
  key: string;
  label: string;
  type: FilterType;
}

/**
 * Checkbox filter option
 * Used for filters with multiple selectable options (e.g., status, vehicle type)
 */
export interface CheckboxFilterOption extends BaseFilterOption {
  type: 'checkbox';
  options: string[] | Array<{ value: string; label: string }>;
}

/**
 * Range filter option
 * Used for numeric ranges with min/max values (e.g., year)
 */
export interface RangeFilterOption extends BaseFilterOption {
  type: 'range';
  min: number;
  max: number;
  step: number;
  placeholder: {
    min: string;
    max: string;
  };
}

/**
 * Number filter option
 * Used for single numeric value filters (e.g., capacity)
 */
export interface NumberFilterOption extends BaseFilterOption {
  type: 'number';
  min: number;
  max: number;
  operator: 'min' | 'max' | 'exact';
  step: number;
  placeholder: string;
}

/**
 * Select filter option
 * Used for single-select dropdown filters
 */
export interface SelectFilterOption extends BaseFilterOption {
  type: 'select';
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

/**
 * Union type for all filter options
 * Allows type-safe handling of different filter types
 */
export type FilterOption =
  | CheckboxFilterOption
  | RangeFilterOption
  | NumberFilterOption
  | SelectFilterOption;

/**
 * Response DTO for getting vehicle filter options
 * Contains all available filter options for vehicle filtering
 */
export interface GetVehicleFilterOptionsResponse {
  success: true;
  filters: FilterOption[];
}

/**
 * Request DTO for deleting vehicle images
 * Accepts array of image URLs to delete
 */
export class DeleteVehicleImagesRequest {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one image URL is required' })
  @IsUrl({}, { each: true, message: 'Each URL must be a valid URL' })
  urls!: string[];
}

/**
 * Response DTO for generating signed upload URL for vehicle images
 * Contains Cloudinary upload URL and signed parameters
 */
export interface GenerateVehicleImageUploadUrlResponse {
  uploadUrl: string;
  params: {
    timestamp: number;
    signature: string;
    api_key: string;
    folder: string;
  };
  expiresIn: number; // Expiration time in seconds
}