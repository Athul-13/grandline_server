import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateIf,
  ArrayMinSize,
  IsDateString,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteStatus, TripType, StopType } from '../../shared/constants';

/**
 * Selected vehicle structure for DTOs
 */
export class SelectedVehicleDto {
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

/**
 * Itinerary stop structure for DTOs
 */
export class ItineraryStopDto {
  @IsString()
  @IsNotEmpty()
  locationName!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @IsOptional()
  @IsBoolean()
  isDriverStaying?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stayingDuration?: number;

  @IsEnum(StopType)
  stopType!: StopType;
}

/**
 * Itinerary structure for DTOs
 */
export class ItineraryDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'Outbound itinerary must have at least pickup and dropoff' })
  @ValidateNested({ each: true })
  @Type(() => ItineraryStopDto)
  outbound!: ItineraryStopDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryStopDto)
  return?: ItineraryStopDto[];
}

/**
 * Passenger structure for DTOs
 */
export class PassengerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsNumber()
  @Min(0)
  @Max(150)
  age!: number;
}

/**
 * Request DTO for creating a quote draft
 */
export class CreateQuoteDraftRequest {
  @IsEnum(TripType)
  tripType!: TripType;
}

/**
 * Request DTO for updating a quote draft
 */
export class UpdateQuoteDraftRequest {
  @IsOptional()
  @IsEnum(TripType)
  tripType?: TripType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  currentStep?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ItineraryDto)
  itinerary?: ItineraryDto;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  tripName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  eventType?: string;

  @IsOptional()
  @ValidateIf((o: UpdateQuoteDraftRequest) => o.eventType === 'Other')
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  customEventType?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers?: PassengerDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SelectedVehicleDto)
  selectedVehicles?: SelectedVehicleDto[];

  @IsOptional()
  @IsArray()
  selectedAmenities?: string[];
}

/**
 * Request DTO for calculating routes
 */
export class CalculateRoutesRequest {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ItineraryDto)
  itinerary!: ItineraryDto;
}

/**
 * Request DTO for getting vehicle recommendations
 */
export class GetRecommendationsRequest {
  @IsNumber()
  @Min(1)
  passengerCount!: number;

  @IsDateString()
  tripStartDate!: string;

  @IsDateString()
  tripEndDate!: string;

  @IsEnum(TripType)
  tripType!: TripType;
}

/**
 * Request DTO for submitting a quote
 */
export class SubmitQuoteRequest {
  @IsString()
  @IsNotEmpty()
  draftId!: string;
}

/**
 * Route segment response DTO
 */
export interface RouteSegmentResponse {
  from: { latitude: number; longitude: number; locationName: string };
  to: { latitude: number; longitude: number; locationName: string };
  distance: number;
  duration: number;
  hasNightTravel: boolean;
}

/**
 * Route calculation response DTO
 */
export interface RouteCalculationResponse {
  outbound: {
    totalDistance: number;
    totalDuration: number;
    routeGeometry: string;
    segments: RouteSegmentResponse[];
  };
  return?: {
    totalDistance: number;
    totalDuration: number;
    routeGeometry: string;
    segments: RouteSegmentResponse[];
  };
}

/**
 * Vehicle recommendation option DTO
 */
export interface VehicleRecommendationOption {
  optionId: string;
  vehicles: Array<{ vehicleId: string; vehicleTypeId: string; name: string; capacity: number; quantity: number; imageUrls?: string[] }>;
  totalCapacity: number;
  estimatedPrice: number;
  isExactMatch: boolean;
}

/**
 * Vehicle recommendation response DTO
 */
export interface VehicleRecommendationResponse {
  recommendations: VehicleRecommendationOption[];
  availableVehicles: Array<{
    vehicleId: string;
    vehicleTypeId: string;
    name: string;
    capacity: number;
    baseFare: number;
    isAvailable: boolean;
    availableQuantity: number;
    imageUrls?: string[];
    includedAmenities: Array<{ amenityId: string; name: string }>;
  }>;
}

/**
 * Pricing breakdown response DTO
 */
export interface PricingBreakdownResponse {
  fuelPriceAtTime?: number;
  averageDriverRateAtTime?: number;
  actualDriverRate?: number;
  taxPercentageAtTime?: number;
  baseFare: number;
  distanceFare: number;
  driverCharge: number;
  fuelMaintenance: number;
  nightCharge: number;
  amenitiesTotal: number;
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Quote response DTO
 */
export interface QuoteResponse {
  quoteId: string;
  userId: string;
  tripType: TripType;
  tripName?: string;
  eventType?: string;
  customEventType?: string;
  passengerCount?: number;
  status: QuoteStatus;
  currentStep?: number;
  selectedVehicles?: SelectedVehicleDto[];
  selectedAmenities?: string[];
  pricing?: PricingBreakdownResponse;
  routeData?: {
    outbound?: { totalDistance?: number; totalDuration?: number; routeGeometry?: string };
    return?: { totalDistance?: number; totalDuration?: number; routeGeometry?: string };
  };
  itinerary?: {
    outbound?: ItineraryStopDto[];
    return?: ItineraryStopDto[];
  };
  passengers?: PassengerDto[];
  chatAvailable?: boolean;
  chatId?: string;
  quotedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quote list item response DTO
 */
export interface QuoteListItemResponse {
  quoteId: string;
  tripName?: string;
  tripType: TripType;
  status: QuoteStatus;
  currentStep?: number;
  totalPrice?: number;
  startLocation?: string;
  endLocation?: string;
  chatAvailable?: boolean;
  chatId?: string;
  createdAt: Date;
  isDeleted?: boolean;
}

/**
 * Quote list response DTO
 */
export interface QuoteListResponse {
  quotes: QuoteListItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create quote draft response DTO
 */
export interface CreateQuoteDraftResponse {
  quoteId: string;
  status: QuoteStatus;
  currentStep: number;
}

/**
 * Submit quote response DTO
 */
export interface SubmitQuoteResponse {
  quoteId: string;
  status: QuoteStatus;
  pricing: PricingBreakdownResponse;
}

/**
 * Recalculate quote response DTO
 * POST /api/v1/admin/quotes/:id/recalculate
 */
export interface RecalculateQuoteResponse {
  success: boolean;
  message: string;
  requiresVehicleReselection?: boolean;
  quote?: QuoteResponse;
}

/**
 * User information for admin quote responses
 */
export interface AdminUserInfo {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

/**
 * Admin quote list item response DTO
 * Extends QuoteListItemResponse with user information
 */
export interface AdminQuoteListItemResponse extends QuoteListItemResponse {
  user: AdminUserInfo;
}

/**
 * Admin quote list response DTO
 */
export interface AdminQuotesListResponse {
  quotes: AdminQuoteListItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Admin quote response DTO
 * Extends QuoteResponse with full user details
 */
export interface AdminQuoteResponse extends QuoteResponse {
  user: AdminUserInfo;
}

/**
 * Request DTO for updating quote status
 * Admin can only change status to PAID and back to SUBMITTED
 */
export class UpdateQuoteStatusRequest {
  @IsEnum(QuoteStatus)
  @IsIn([QuoteStatus.PAID, QuoteStatus.SUBMITTED], {
    message: 'Status can only be changed to PAID or back to SUBMITTED',
  })
  @IsNotEmpty()
  status!: QuoteStatus;
}

/**
 * Request DTO for assigning driver to quote
 */
export class AssignDriverToQuoteRequest {
  @IsString()
  @IsNotEmpty()
  driverId!: string;
}

