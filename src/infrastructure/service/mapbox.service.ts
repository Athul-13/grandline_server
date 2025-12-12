import { injectable } from 'tsyringe';
import { MAPBOX_CONFIG } from '../../shared/config';

/**
 * Mapbox Directions API response structure
 */
interface MapboxDirectionsResponse {
  routes: Array<{
    distance: number; // in meters
    duration: number; // in seconds
    geometry: {
      coordinates: number[][];
    };
    legs: Array<{
      steps: Array<{
        duration: number;
        distance: number;
      }>;
    }>;
  }>;
}

/**
 * Mapbox service for interacting with Mapbox Directions API
 */
@injectable()
export class MapboxService {
  private readonly accessToken: string;
  private readonly apiBaseUrl: string;

  constructor() {
    this.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN;
    this.apiBaseUrl = MAPBOX_CONFIG.API_BASE_URL;
  }

  /**
   * Gets directions between two points using Mapbox Directions API
   */
  async getDirections(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<{
    distance: number; // in kilometers
    duration: number; // in hours
    geometry: string; // encoded polyline
  }> {
    if (!this.accessToken) {
      throw new Error('Mapbox access token is not configured');
    }

    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `${this.apiBaseUrl}/mapbox/driving/${coordinates}?access_token=${this.accessToken}&geometries=geojson`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json() as MapboxDirectionsResponse;

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found');
      }

      const route = data.routes[0];
      const distanceKm = route.distance / 1000; // Convert meters to kilometers
      const durationHours = route.duration / 3600; // Convert seconds to hours

      // Encode geometry as JSON string (can be converted to polyline later if needed)
      const geometry = JSON.stringify(route.geometry);

      return {
        distance: distanceKm,
        duration: durationHours,
        geometry,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get directions: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Checks if travel time includes night hours (10 PM - 6 AM)
   */
  isNightTravel(arrivalTime: Date, durationHours: number): boolean {
    const arrivalHour = arrivalTime.getHours();
    const departureTime = new Date(arrivalTime.getTime() - durationHours * 3600 * 1000);
    const departureHour = departureTime.getHours();

    // Check if arrival or departure is between 10 PM (22) and 6 AM (6)
    return (
      (arrivalHour >= 22 || arrivalHour < 6) || (departureHour >= 22 || departureHour < 6)
    );
  }
}

