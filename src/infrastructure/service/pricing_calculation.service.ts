import { injectable } from 'tsyringe';
import {
  IPricingCalculationService,
  IPricingCalculationInput,
} from '../../domain/services/pricing_calculation_service.interface';
import { IPricingBreakdown, IRouteData } from '../../domain/entities/quote.entity';
import { QuoteItinerary } from '../../domain/entities/quote_itinerary.entity';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { Amenity } from '../../domain/entities/amenity.entity';
import { PricingConfig } from '../../domain/entities/pricing_config.entity';

/**
 * Pricing calculation service implementation
 * Handles all pricing calculations for quotes
 */
@injectable()
export class PricingCalculationServiceImpl implements IPricingCalculationService {
  calculatePricing(input: IPricingCalculationInput): IPricingBreakdown {
    const baseFare = this.calculateBaseFare(input.selectedVehicles);
    const totalDistance = this.calculateTotalDistance(input.routeData);
    const totalDuration = this.calculateTotalDuration(input.routeData);

    const distanceFare = this.calculateDistanceFare(
      totalDistance,
      input.selectedVehicles,
      input.pricingConfig.fuelPrice
    );

    const driverCharge = this.calculateDriverCharge(
      totalDuration,
      input.pricingConfig.averageDriverPerHourRate
    );

    const nightCharge = this.calculateNightCharge(
      [...input.itinerary.outbound, ...(input.itinerary.return || [])],
      input.pricingConfig.nightChargePerNight
    );

    const stayingCharge = this.calculateStayingCharge(
      [...input.itinerary.outbound, ...(input.itinerary.return || [])],
      input.pricingConfig.stayingChargePerDay
    );

    const amenitiesTotal = this.calculateAmenitiesTotal(input.selectedAmenities);

    const subtotal =
      baseFare + distanceFare + driverCharge + nightCharge + stayingCharge + amenitiesTotal;

    const tax = this.calculateTax(subtotal, input.pricingConfig.taxPercentage);

    const total = subtotal + tax;

    return {
      fuelPriceAtTime: input.pricingConfig.fuelPrice,
      averageDriverRateAtTime: input.pricingConfig.averageDriverPerHourRate,
      taxPercentageAtTime: input.pricingConfig.taxPercentage,
      baseFare,
      distanceFare,
      driverCharge,
      fuelMaintenance: 0, // Removed duplicate - distanceFare already includes fuel cost
      nightCharge,
      stayingCharge,
      amenitiesTotal,
      subtotal,
      tax,
      total,
    };
  }

  calculateBaseFare(vehicles: Array<{ vehicle: Vehicle; quantity: number }>): number {
    return vehicles.reduce((total, { vehicle, quantity }) => {
      return total + vehicle.baseFare * quantity;
    }, 0);
  }

  calculateDistanceFare(
    totalDistance: number,
    vehicles: Array<{ vehicle: Vehicle; quantity: number }>,
    fuelPrice: number
  ): number {
    // Distance fare = distance × fuel consumption × fuel price
    const totalFuelConsumption = vehicles.reduce((total, { vehicle, quantity }) => {
      return total + vehicle.fuelConsumption * quantity;
    }, 0);

    return totalDistance * totalFuelConsumption * fuelPrice;
  }

  calculateDriverCharge(totalDuration: number, driverRatePerHour: number): number {
    return totalDuration * driverRatePerHour;
  }

  calculateFuelMaintenance(
    totalDistance: number,
    vehicles: Array<{ vehicle: Vehicle; quantity: number }>,
    fuelPrice: number
  ): number {
    // Removed - this was a duplicate of distanceFare
    // Distance fare already includes: distance × fuel consumption × fuel price
    return 0;
  }

  calculateNightCharge(
    itinerary: QuoteItinerary[],
    nightChargePerNight: number
  ): number {
    // Count nights (10 PM - 6 AM) in the itinerary
    let nightCount = 0;
    const nightHours = new Set([22, 23, 0, 1, 2, 3, 4, 5]);

    for (const stop of itinerary) {
      const arrivalHour = stop.arrivalTime.getHours();
      if (nightHours.has(arrivalHour)) {
        nightCount++;
      }
    }

    return nightCount * nightChargePerNight;
  }

  calculateStayingCharge(
    itinerary: QuoteItinerary[],
    stayingChargePerDay: number
  ): number {
    let totalStayingCharge = 0;

    for (const stop of itinerary) {
      if (stop.isDriverStaying && stop.stayingDuration && stop.stayingDuration >= 24) {
        const days = Math.ceil(stop.stayingDuration / 24);
        totalStayingCharge += days * stayingChargePerDay;
      }
    }

    return totalStayingCharge;
  }

  calculateAmenitiesTotal(amenities: Amenity[]): number {
    return amenities.reduce((total, amenity) => {
      return total + amenity.getPrice();
    }, 0);
  }

  calculateTax(subtotal: number, taxPercentage: number): number {
    return (subtotal * taxPercentage) / 100;
  }

  private calculateTotalDistance(routeData?: IRouteData): number {
    if (!routeData) {
      return 0;
    }
    const outboundDistance = routeData.outbound?.totalDistance ?? 0;
    const returnDistance = routeData.return?.totalDistance ?? 0;
    return outboundDistance + returnDistance;
  }

  private calculateTotalDuration(routeData?: IRouteData): number {
    if (!routeData) {
      return 0;
    }
    const outboundDuration = routeData.outbound?.totalDuration ?? 0;
    const returnDuration = routeData.return?.totalDuration ?? 0;
    return outboundDuration + returnDuration;
  }
}

