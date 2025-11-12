import { IPricingBreakdown, IRouteData } from '../entities/quote.entity';
import { QuoteItinerary } from '../entities/quote_itinerary.entity';
import { PricingConfig } from '../entities/pricing_config.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Amenity } from '../entities/amenity.entity';

/**
 * Input data for pricing calculation
 */
export interface IPricingCalculationInput {
  selectedVehicles: Array<{ vehicle: Vehicle; quantity: number }>;
  selectedAmenities: Amenity[];
  itinerary: {
    outbound: QuoteItinerary[];
    return?: QuoteItinerary[];
  };
  pricingConfig: PricingConfig;
  tripType: 'one_way' | 'two_way';
  routeData?: IRouteData; // Route data from route calculation
}

/**
 * Pricing calculation service interface
 * Defines the contract for calculating quote pricing
 */
export interface IPricingCalculationService {
  /**
   * Calculates the total price for a quote
   */
  calculatePricing(input: IPricingCalculationInput): IPricingBreakdown;

  /**
   * Calculates base fare from selected vehicles
   */
  calculateBaseFare(vehicles: Array<{ vehicle: Vehicle; quantity: number }>): number;

  /**
   * Calculates distance fare based on route distance and fuel consumption
   */
  calculateDistanceFare(
    totalDistance: number,
    vehicles: Array<{ vehicle: Vehicle; quantity: number }>,
    fuelPrice: number
  ): number;

  /**
   * Calculates driver charge based on trip duration
   */
  calculateDriverCharge(totalDuration: number, driverRatePerHour: number): number;

  /**
   * Calculates fuel and maintenance costs
   * Note: This is kept for backward compatibility but returns 0.
   * Fuel cost is already included in distanceFare calculation.
   */
  calculateFuelMaintenance(
    totalDistance: number,
    vehicles: Array<{ vehicle: Vehicle; quantity: number }>,
    fuelPrice: number
  ): number;

  /**
   * Calculates night charge if trip includes night travel
   */
  calculateNightCharge(
    itinerary: QuoteItinerary[],
    nightChargePerNight: number
  ): number;

  /**
   * Calculates staying charge if driver stays at location for 1+ days
   */
  calculateStayingCharge(
    itinerary: QuoteItinerary[],
    stayingChargePerDay: number
  ): number;

  /**
   * Calculates amenities total
   */
  calculateAmenitiesTotal(amenities: Amenity[]): number;

  /**
   * Calculates tax on subtotal
   */
  calculateTax(subtotal: number, taxPercentage: number): number;
}

