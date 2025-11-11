import { injectable } from 'tsyringe';
import {
  IRouteCalculationService,
  IRouteSegment,
  IRouteCalculationResult,
} from '../../domain/services/route_calculation_service.interface';
import { QuoteItinerary } from '../../domain/entities/quote_itinerary.entity';
import { MapboxService } from './mapbox.service';

/**
 * Route calculation service implementation
 * Handles route calculation using Mapbox service
 */
@injectable()
export class RouteCalculationServiceImpl implements IRouteCalculationService {
  constructor(private readonly mapboxService: MapboxService) {}

  async calculateRouteSegment(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<IRouteSegment> {
    const result = await this.mapboxService.getDirections(from, to);

    // Check for night travel (using current time as reference, will be refined with actual times)
    const now = new Date();
    const hasNightTravel = this.mapboxService.isNightTravel(now, result.duration);

    return {
      from: { ...from, locationName: '' }, // Location names will be filled from itinerary
      to: { ...to, locationName: '' },
      distance: result.distance,
      duration: result.duration,
      hasNightTravel,
    };
  }

  async calculateRoute(itinerary: QuoteItinerary[]): Promise<IRouteCalculationResult> {
    if (itinerary.length < 2) {
      throw new Error('Itinerary must have at least 2 stops');
    }

    const segments: IRouteSegment[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let combinedGeometry: number[][][] = [];

    // Calculate route for each segment
    for (let i = 0; i < itinerary.length - 1; i++) {
      const from = itinerary[i];
      const to = itinerary[i + 1];

      const routeResult = await this.mapboxService.getDirections(
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude }
      );

      // Check for night travel based on arrival time
      const hasNightTravel = this.mapboxService.isNightTravel(
        from.arrivalTime,
        routeResult.duration
      );

      const segment: IRouteSegment = {
        from: {
          latitude: from.latitude,
          longitude: from.longitude,
          locationName: from.locationName,
        },
        to: {
          latitude: to.latitude,
          longitude: to.longitude,
          locationName: to.locationName,
        },
        distance: routeResult.distance,
        duration: routeResult.duration,
        hasNightTravel,
      };

      segments.push(segment);
      totalDistance += routeResult.distance;
      totalDuration += routeResult.duration;

      // Parse and combine geometry
      try {
        const geometry = JSON.parse(routeResult.geometry);
        if (geometry.coordinates) {
          combinedGeometry.push(...geometry.coordinates);
        }
      } catch {
        // If geometry parsing fails, continue without it
      }
    }

    // Combine all geometries into one
    const finalGeometry = JSON.stringify({
      type: 'LineString',
      coordinates: combinedGeometry,
    });

    return {
      totalDistance,
      totalDuration,
      routeGeometry: finalGeometry,
      segments,
    };
  }

  async calculateRoutes(
    outbound: QuoteItinerary[],
    returnTrip?: QuoteItinerary[]
  ): Promise<{
    outbound: IRouteCalculationResult;
    return?: IRouteCalculationResult;
  }> {
    const outboundResult = await this.calculateRoute(outbound);

    if (!returnTrip || returnTrip.length === 0) {
      return {
        outbound: outboundResult,
      };
    }

    const returnResult = await this.calculateRoute(returnTrip);

    return {
      outbound: outboundResult,
      return: returnResult,
    };
  }
}

