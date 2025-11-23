import { injectable } from 'tsyringe';
import {
  IPricingCalculationService,
  IPricingCalculationInput,
} from '../../domain/services/pricing_calculation_service.interface';
import { IPricingBreakdown, IRouteData } from '../../domain/entities/quote.entity';
import { QuoteItinerary } from '../../domain/entities/quote_itinerary.entity';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { Amenity } from '../../domain/entities/amenity.entity';

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

    const amenitiesTotal = this.calculateAmenitiesTotal(input.selectedAmenities);

    const subtotal =
      baseFare + distanceFare + driverCharge + nightCharge + amenitiesTotal;

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
    // Distance fare = distance × fuel consumption (L/km) × fuel price
    // Note: fuelConsumption is stored as km/L in DB, convert to L/km: 1 / (km/L) = L/km
    const totalFuelConsumption = vehicles.reduce((total, { vehicle, quantity }) => {
      const fuelConsumptionInLPerKm = 1 / vehicle.fuelConsumption; // Convert km/L to L/km
      return total + fuelConsumptionInLPerKm * quantity;
    }, 0);

    return totalDistance * totalFuelConsumption * fuelPrice;
  }

  calculateDriverCharge(totalDuration: number, driverRatePerHour: number): number {
    return totalDuration * driverRatePerHour;
  }

  calculateFuelMaintenance(
    _totalDistance: number,
    _vehicles: Array<{ vehicle: Vehicle; quantity: number }>,
    _fuelPrice: number
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

