import { QuoteItinerary } from '../entities/quote_itinerary.entity';

/**
 * Route segment information
 */
export interface IRouteSegment {
  from: { latitude: number; longitude: number; locationName: string };
  to: { latitude: number; longitude: number; locationName: string };
  distance: number; // in kilometers
  duration: number; // in hours
  hasNightTravel: boolean;
}

/**
 * Route calculation result
 */
export interface IRouteCalculationResult {
  totalDistance: number; // in kilometers
  totalDuration: number; // in hours
  routeGeometry: string; // encoded polyline or GeoJSON
  segments: IRouteSegment[];
}

/**
 * Route calculation service interface
 * Defines the contract for calculating routes using map services
 */
export interface IRouteCalculationService {
  /**
   * Calculates route for a single segment (from one point to another)
   */
  calculateRouteSegment(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<IRouteSegment>;

  /**
   * Calculates complete route for an itinerary
   */
  calculateRoute(itinerary: QuoteItinerary[]): Promise<IRouteCalculationResult>;

  /**
   * Calculates routes for both outbound and return trips
   */
  calculateRoutes(
    outbound: QuoteItinerary[],
    return?: QuoteItinerary[]
  ): Promise<{
    outbound: IRouteCalculationResult;
    return?: IRouteCalculationResult;
  }>;
}

