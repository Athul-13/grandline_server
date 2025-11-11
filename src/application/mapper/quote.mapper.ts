import { Quote } from '../../domain/entities/quote.entity';
import { QuoteResponse, QuoteListItemResponse, SelectedVehicleDto } from '../dtos/quote.dto';
import { PricingBreakdownResponse } from '../dtos/quote.dto';

/**
 * Quote mapper
 * Converts domain entities to DTOs
 */
export class QuoteMapper {
  static toQuoteResponse(quote: Quote): QuoteResponse {
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
            baseFare: quote.pricing.baseFare || 0,
            distanceFare: quote.pricing.distanceFare || 0,
            driverCharge: quote.pricing.driverCharge || 0,
            fuelMaintenance: quote.pricing.fuelMaintenance || 0,
            nightCharge: quote.pricing.nightCharge || 0,
            stayingCharge: quote.pricing.stayingCharge || 0,
            amenitiesTotal: quote.pricing.amenitiesTotal || 0,
            subtotal: quote.pricing.subtotal || 0,
            tax: quote.pricing.tax || 0,
            total: quote.pricing.total || 0,
          }
        : undefined,
      routeData: quote.routeData,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
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

