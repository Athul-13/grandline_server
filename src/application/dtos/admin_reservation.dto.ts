import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '../../shared/constants';

/**
 * Request DTO for updating reservation status
 */
export class UpdateReservationStatusRequest {
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status!: ReservationStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Request DTO for adding passengers to reservation
 */
export class AddPassengersToReservationRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers!: PassengerDto[];
}

/**
 * Passenger DTO for adding to reservation
 */
export class PassengerDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsNumber()
  @Min(0)
  age!: number;
}

/**
 * Request DTO for changing reservation driver
 */
export class ChangeReservationDriverRequest {
  @IsString()
  @IsNotEmpty()
  driverId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Request DTO for adjusting reservation vehicles
 */
export class AdjustReservationVehiclesRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VehicleAdjustmentDto)
  vehicles!: VehicleAdjustmentDto[];
}

/**
 * Vehicle adjustment DTO
 */
export class VehicleAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

/**
 * Request DTO for processing refund
 */
export class ProcessReservationRefundRequest {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Request DTO for cancelling reservation
 */
export class CancelReservationRequest {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

/**
 * Request DTO for adding charge to reservation
 */
export class AddReservationChargeRequest {
  @IsEnum(['additional_passenger', 'vehicle_upgrade', 'amenity_add', 'late_fee', 'other'])
  @IsNotEmpty()
  chargeType!: 'additional_passenger' | 'vehicle_upgrade' | 'amenity_add' | 'late_fee' | 'other';

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

