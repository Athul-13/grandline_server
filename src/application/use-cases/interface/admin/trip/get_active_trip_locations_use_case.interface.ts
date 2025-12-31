/**
 * Location data for an active trip
 */
export interface ActiveTripLocation {
  reservationId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

/**
 * Interface for getting active trip locations use case
 */
export interface IGetActiveTripLocationsUseCase {
  /**
   * Executes the use case to get all active trip locations from Redis
   * @returns Array of active trip locations
   */
  execute(): Promise<ActiveTripLocation[]>;
}

