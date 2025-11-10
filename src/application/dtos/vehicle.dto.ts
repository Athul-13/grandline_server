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
  @ValidateIf((o) => o.description !== undefined)
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
  @ValidateIf((o) => o.description !== undefined)
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
}

/**
 * Request DTO for updating vehicle
 * All fields are optional - only provided fields will be updated
 */
export class UpdateVehicleRequest {
  @IsOptional()
  @ValidateIf((o) => o.vehicleTypeId !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\S+$/, {
    message: 'Vehicle type ID must not contain whitespace',
  })
  vehicleTypeId?: string;

  @IsOptional()
  @ValidateIf((o) => o.capacity !== undefined)
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @ValidateIf((o) => o.baseFare !== undefined)
  @IsNumber()
  @Min(0)
  baseFare?: number;

  @IsOptional()
  @ValidateIf((o) => o.maintenance !== undefined)
  @IsNumber()
  @Min(0)
  maintenance?: number;

  @IsOptional()
  @ValidateIf((o) => o.plateNumber !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Matches(/.*\S.*/, {
    message: 'Plate number must contain at least one non-whitespace character',
  })
  plateNumber?: string;

  @IsOptional()
  @ValidateIf((o) => o.vehicleModel !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Matches(/.*\S.*/, {
    message: 'Vehicle model must contain at least one non-whitespace character',
  })
  vehicleModel?: string;

  @IsOptional()
  @ValidateIf((o) => o.year !== undefined)
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
  @ValidateIf((o) => o.fuelConsumption !== undefined)
  @IsNumber()
  @Min(0)
  fuelConsumption?: number;

  @IsOptional()
  @ValidateIf((o) => o.imageUrls !== undefined)
  @IsArray()
  @ArrayMinSize(1, { message: 'Image URLs array must contain at least one URL if provided' })
  @IsUrl({}, { each: true, message: 'Each image URL must be a valid URL' })
  imageUrls?: string[];
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
  vehicleTypeId: string;
  capacity: number;
  baseFare: number;
  maintenance: number;
  plateNumber: string;
  vehicleModel: string;
  year: number;
  fuelConsumption: number;
  imageUrls?: string[];
  status: VehicleStatus;
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
 * Response DTO for getting all vehicles
 * Contains list of vehicles
 */
export interface GetAllVehiclesResponse {
  vehicles: VehicleResponse[];
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