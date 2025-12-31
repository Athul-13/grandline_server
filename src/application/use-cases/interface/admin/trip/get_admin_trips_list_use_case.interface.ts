import { AdminTripsListResponse } from '../../../../dtos/trip.dto';
import { TripState } from '../../../../dtos/trip.dto';

/**
 * Interface for getting admin trips list use case
 */
export interface IGetAdminTripsListUseCase {
  /**
   * Executes the use case to get admin trips list
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 20)
   * @param state Optional trip state filter (UPCOMING, CURRENT, PAST)
   * @param search Optional search query (searches tripName, userName, driverName, reservationId)
   * @param sortBy Optional sort field
   * @param sortOrder Sort order (asc or desc, default: asc)
   * @returns Admin trips list response
   */
  execute(
    page?: number,
    limit?: number,
    state?: TripState,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<AdminTripsListResponse>;
}

