/**
 * Trip DTOs
 * Data Transfer Objects for trip management
 */

/**
 * Trip state enumeration
 */
export type TripState = 'UPCOMING' | 'CURRENT' | 'PAST';

/**
 * Admin trip list item response DTO
 * Represents a trip in the admin trips list
 */
export interface AdminTripListItemResponse {
  reservationId: string;
  tripName?: string;
  userName: string;
  driverName?: string;
  tripStartAt: Date;
  tripEndAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  derivedTripState: TripState;
  legacyExpired: boolean;
}

/**
 * Admin trip list response DTO
 */
export interface AdminTripsListResponse {
  trips: AdminTripListItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

