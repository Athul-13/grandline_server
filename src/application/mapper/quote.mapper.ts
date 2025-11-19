import { Quote } from '../../domain/entities/quote.entity';
import { QuoteItinerary } from '../../domain/entities/quote_itinerary.entity';
import { Passenger } from '../../domain/entities/passenger.entity';
import { QuoteResponse, QuoteListItemResponse, ItineraryStopDto, PassengerDto } from '../dtos/quote.dto';

/**
 * Quote mapper
 * Converts domain entities to DTOs
 */
export class QuoteMapper {
  static toQuoteResponse(
    quote: Quote,
    itineraryStops?: QuoteItinerary[],
    passengers?: Passenger[]
  ): QuoteResponse {
    // Map itinerary stops to DTO format
    let itinerary: { outbound?: ItineraryStopDto[]; return?: ItineraryStopDto[] } | undefined;
    if (itineraryStops && itineraryStops.length > 0) {
      const outbound = itineraryStops
        .filter((stop) => stop.tripType === 'outbound')
        .sort((a, b) => a.stopOrder - b.stopOrder)
        .map((stop) => this.mapItineraryStopToDto(stop));

      const returnStops = itineraryStops
        .filter((stop) => stop.tripType === 'return')
        .sort((a, b) => a.stopOrder - b.stopOrder)
        .map((stop) => this.mapItineraryStopToDto(stop));

      itinerary = {
        outbound: outbound.length > 0 ? outbound : undefined,
        return: returnStops.length > 0 ? returnStops : undefined,
      };
    }

    // Map passengers to DTO format
    const passengersDto: PassengerDto[] | undefined = passengers
      ? passengers.map((passenger) => ({
          fullName: passenger.fullName,
          phoneNumber: passenger.phoneNumber,
          age: passenger.age,
        }))
      : undefined;

    return {
      quoteId: quote.quoteId,
      userId: quote.userId,
      tripType: quote.tripType,
      tripName: quote.tripName,
      eventType: quote.eventType,
      customEventType: quote.customEventType,
      passengerCount: quote.passengerCount,
      status: quote.status,
      currentStep: quote.currentStep,
      selectedVehicles: quote.selectedVehicles?.map((v) => ({
        vehicleId: v.vehicleId,
        quantity: v.quantity,
      })),
      selectedAmenities: quote.selectedAmenities,
      pricing: quote.pricing
        ? {
            fuelPriceAtTime: quote.pricing.fuelPriceAtTime,
            averageDriverRateAtTime: quote.pricing.averageDriverRateAtTime,
            taxPercentageAtTime: quote.pricing.taxPercentageAtTime,
            baseFare: quote.pricing.baseFare ?? 0,
            distanceFare: quote.pricing.distanceFare ?? 0,
            driverCharge: quote.pricing.driverCharge ?? 0,
            fuelMaintenance: quote.pricing.fuelMaintenance ?? 0,
            nightCharge: quote.pricing.nightCharge ?? 0,
            stayingCharge: quote.pricing.stayingCharge ?? 0,
            amenitiesTotal: quote.pricing.amenitiesTotal ?? 0,
            subtotal: quote.pricing.subtotal ?? 0,
            tax: quote.pricing.tax ?? 0,
            total: quote.pricing.total ?? 0,
          }
        : undefined,
      routeData: quote.routeData,
      itinerary,
      passengers: passengersDto,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }

  private static mapItineraryStopToDto(stop: QuoteItinerary): ItineraryStopDto {
    return {
      locationName: stop.locationName,
      latitude: stop.latitude,
      longitude: stop.longitude,
      arrivalTime: stop.arrivalTime.toISOString(),
      departureTime: stop.departureTime?.toISOString(),
      isDriverStaying: stop.isDriverStaying,
      stayingDuration: stop.stayingDuration,
      stopType: stop.stopType,
    };
  }

  static toQuoteListItemResponse(quote: Quote): QuoteListItemResponse {
    return {
      quoteId: quote.quoteId,
      tripName: quote.tripName,
      tripType: quote.tripType,
      status: quote.status,
      currentStep: quote.currentStep,
      totalPrice: quote.pricing?.total,
      createdAt: quote.createdAt,
    };
  }
}

