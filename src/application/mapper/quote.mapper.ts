import { Quote } from '../../domain/entities/quote.entity';
import { QuoteItinerary } from '../../domain/entities/quote_itinerary.entity';
import { Passenger } from '../../domain/entities/passenger.entity';
import { QuoteResponse, QuoteListItemResponse, ItineraryStopDto, PassengerDto } from '../dtos/quote.dto';
import { StopType, TripType } from '../../shared/constants';

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
            actualDriverRate: quote.actualDriverRate,
            taxPercentageAtTime: quote.pricing.taxPercentageAtTime,
            baseFare: quote.pricing.baseFare ?? 0,
            distanceFare: quote.pricing.distanceFare ?? 0,
            driverCharge: quote.pricing.driverCharge ?? 0,
            fuelMaintenance: quote.pricing.fuelMaintenance ?? 0,
            nightCharge: quote.pricing.nightCharge ?? 0,
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

  static toQuoteListItemResponse(
    quote: Quote,
    itineraryStops?: QuoteItinerary[]
  ): QuoteListItemResponse {
    // Extract start and end locations from itinerary
    let startLocation: string | undefined;
    let endLocation: string | undefined;

    if (itineraryStops && itineraryStops.length > 0) {
      // Get outbound stops sorted by order
      const outboundStops = itineraryStops
        .filter((stop) => stop.tripType === 'outbound')
        .sort((a, b) => a.stopOrder - b.stopOrder);

      // Start location: first pickup in outbound
      const pickupStop = outboundStops.find((stop) => stop.stopType === StopType.PICKUP);
      if (pickupStop) {
        startLocation = pickupStop.locationName;
      }

      // End location: last dropoff in outbound (for one_way) or return (for two_way)
      if (quote.tripType === TripType.ONE_WAY) {
        // For one-way, find last dropoff in outbound
        const dropoffStops = outboundStops.filter((stop) => stop.stopType === StopType.DROPOFF);
        if (dropoffStops.length > 0) {
          endLocation = dropoffStops[dropoffStops.length - 1].locationName;
        }
      } else {
        // For two-way, find last dropoff in return itinerary
        const returnStops = itineraryStops
          .filter((stop) => stop.tripType === 'return')
          .sort((a, b) => a.stopOrder - b.stopOrder);
        const dropoffStops = returnStops.filter((stop) => stop.stopType === StopType.DROPOFF);
        if (dropoffStops.length > 0) {
          endLocation = dropoffStops[dropoffStops.length - 1].locationName;
        } else {
          // Fallback: if no return dropoff, use last outbound dropoff
          const outboundDropoffStops = outboundStops.filter((stop) => stop.stopType === StopType.DROPOFF);
          if (outboundDropoffStops.length > 0) {
            endLocation = outboundDropoffStops[outboundDropoffStops.length - 1].locationName;
          }
        }
      }
    }

    return {
      quoteId: quote.quoteId,
      tripName: quote.tripName,
      tripType: quote.tripType,
      status: quote.status,
      currentStep: quote.currentStep,
      totalPrice: quote.pricing?.total,
      startLocation,
      endLocation,
      createdAt: quote.createdAt,
      isDeleted: quote.isDeleted
    };
  }
}

