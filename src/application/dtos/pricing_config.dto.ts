import {
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * Request DTO for creating a new pricing configuration
 */
export class CreatePricingConfigRequest {
  @IsNumber()
  @Min(0, { message: 'Fuel price must be a positive number' })
  @IsNotEmpty()
  fuelPrice!: number;

  @IsNumber()
  @Min(0, { message: 'Average driver per hour rate must be a positive number' })
  @IsNotEmpty()
  averageDriverPerHourRate!: number;

  @IsNumber()
  @Min(0, { message: 'Tax percentage must be 0 or greater' })
  @Max(100, { message: 'Tax percentage must be 100 or less' })
  @IsNotEmpty()
  taxPercentage!: number;

  @IsNumber()
  @Min(0, { message: 'Night charge per night must be a positive number' })
  @IsNotEmpty()
  nightChargePerNight!: number;
}

/**
 * Response DTO for pricing configuration
 */
export interface PricingConfigResponse {
  pricingConfigId: string;
  version: number;
  fuelPrice: number;
  averageDriverPerHourRate: number;
  taxPercentage: number;
  nightChargePerNight: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for pricing configuration history (list)
 */
export interface PricingConfigHistoryResponse {
  pricingConfigs: PricingConfigResponse[];
}

