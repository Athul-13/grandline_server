import { injectable, inject } from 'tsyringe';
import { ICalculateRoutesUseCase } from '../../interface/quote/calculate_routes_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IQuoteItineraryRepository } from '../../../../domain/repositories/quote_itinerary_repository.interface';
import { IRouteCalculationService } from '../../../../domain/services/route_calculation_service.interface';
import { CalculateRoutesRequest, RouteCalculationResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { QuoteItinerary } from '../../../../domain/entities/quote_itinerary.entity';
import { StopType } from '../../../../shared/constants';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { randomUUID } from 'crypto';

/**
 * Use case for calculating routes
 * Calculates routes for itinerary using Mapbox service
 */
@injectable()
export class CalculateRoutesUseCase implements ICalculateRoutesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
    @inject(SERVICE_TOKENS.IRouteCalculationService)
    private readonly routeCalculationService: IRouteCalculationService
  ) {}

  async execute(
    quoteId: string,
    request: CalculateRoutesRequest,
    userId: string
  ): Promise<RouteCalculationResponse> {
    // Verify quote exists and user owns it
    const quote = await this.quoteRepository.findById(quoteId);

    if (!quote) {
      logger.warn(`Attempt to calculate routes for non-existent quote: ${quoteId}`);
      throw new Error(ERROR_MESSAGES.QUOTE_NOT_FOUND);
    }

    if (quote.userId !== userId) {
      logger.warn(`User ${userId} attempted to calculate routes for quote ${quoteId} owned by ${quote.userId}`);
      throw new Error(ERROR_MESSAGES.FORBIDDEN);
    }

    // Convert DTO itinerary to domain entities
    const outboundItinerary = this.convertDtoToItinerary(quoteId, request.itinerary.outbound, 'outbound');
    const returnItinerary = request.itinerary.return
      ? this.convertDtoToItinerary(quoteId, request.itinerary.return, 'return')
      : undefined;

    // Calculate routes
    const routeResult = await this.routeCalculationService.calculateRoutes(
      outboundItinerary,
      returnItinerary
    );

    // Save itinerary stops to database
    // Delete existing stops first
    await this.itineraryRepository.deleteByQuoteId(quoteId);

    // Save outbound stops
    for (const stop of outboundItinerary) {
      await this.itineraryRepository.create(stop);
    }

    // Save return stops if exists
    if (returnItinerary) {
      for (const stop of returnItinerary) {
        await this.itineraryRepository.create(stop);
      }
    }

    // Update quote with route data
    await this.quoteRepository.updateById(quoteId, {
      routeData: {
        outbound: {
          totalDistance: routeResult.outbound.totalDistance,
          totalDuration: routeResult.outbound.totalDuration,
          routeGeometry: routeResult.outbound.routeGeometry,
        },
        return: routeResult.return
          ? {
              totalDistance: routeResult.return.totalDistance,
              totalDuration: routeResult.return.totalDuration,
              routeGeometry: routeResult.return.routeGeometry,
            }
          : undefined,
      },
    } as any);

    // Convert to response DTO
    return {
      outbound: {
        totalDistance: routeResult.outbound.totalDistance,
        totalDuration: routeResult.outbound.totalDuration,
        routeGeometry: routeResult.outbound.routeGeometry,
        segments: routeResult.outbound.segments.map((segment) => ({
          from: segment.from,
          to: segment.to,
          distance: segment.distance,
          duration: segment.duration,
          hasNightTravel: segment.hasNightTravel,
        })),
      },
      return: routeResult.return
        ? {
            totalDistance: routeResult.return.totalDistance,
            totalDuration: routeResult.return.totalDuration,
            routeGeometry: routeResult.return.routeGeometry,
            segments: routeResult.return.segments.map((segment) => ({
              from: segment.from,
              to: segment.to,
              distance: segment.distance,
              duration: segment.duration,
              hasNightTravel: segment.hasNightTravel,
            })),
          }
        : undefined,
    };
  }

  private convertDtoToItinerary(
    quoteId: string,
    stops: Array<{
      locationName: string;
      latitude: number;
      longitude: number;
      arrivalTime: string;
      departureTime?: string;
      isDriverStaying?: boolean;
      stayingDuration?: number;
      stopType: StopType;
    }>,
    tripType: 'outbound' | 'return'
  ): QuoteItinerary[] {
    const now = new Date();
    return stops.map((stop, index) => {
      return new QuoteItinerary(
        randomUUID(),
        quoteId,
        tripType,
        index,
        stop.locationName,
        stop.latitude,
        stop.longitude,
        new Date(stop.arrivalTime),
        stop.stopType,
        now,
        now,
        stop.departureTime ? new Date(stop.departureTime) : undefined,
        stop.isDriverStaying || false,
        stop.stayingDuration
      );
    });
  }
}

