import { ReservationStatus, TripType, StopType } from '../../shared/constants';
import { RiderPrivacy } from './driver_dashboard.dto';

/**
 * Driver reservation itinerary stop DTO
 */
export interface DriverReservationItineraryStopDto {
  itineraryId: string;
  tripType: 'outbound' | 'return';
  stopOrder: number;
  locationName: string;
  latitude: number;
  longitude: number;
  arrivalTime: string; // ISO
  departureTime?: string; // ISO
  stopType: StopType;
  isDriverStaying: boolean;
  stayingDuration?: number;
}

/**
 * Driver reservation vehicle DTO (expanded, no images)
 */
export interface DriverReservationVehicleDto {
  vehicleId: string;
  vehicleModel: string;
  plateNumber: string;
  quantity: number;
}

/**
 * Driver reservation rider DTO (with privacy enforcement)
 */
export interface DriverReservationRiderDto {
  userId: string;
  fullName: string;
  privacy: RiderPrivacy;
  email?: string;
  phoneNumber?: string;
}

/**
 * Driver reservation route data DTO
 */
export interface DriverReservationRouteDataDto {
  outbound?: {
    totalDistance?: number;
    totalDuration?: number;
    routeGeometry?: string;
  };
  return?: {
    totalDistance?: number;
    totalDuration?: number;
    routeGeometry?: string;
  };
}

/**
 * Driver reservation details response DTO
 * Contains all data needed for Driver Trip Details screen
 */
export interface DriverReservationDetailsResponse {
  reservationId: string;
  status: ReservationStatus;
  tripType: TripType;
  tripName?: string;
  eventType?: string;
  customEventType?: string;
  passengerCount?: number;
  selectedAmenities?: string[];
  reservationDate: string; // ISO
  confirmedAt?: string; // ISO
  driverChangedAt?: string; // ISO
  cancellationReason?: string;
  cancelledAt?: string; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
  // Expanded vehicle details (no images)
  vehicles: DriverReservationVehicleDto[];
  // Full itinerary (all stops, ordered)
  itinerary: DriverReservationItineraryStopDto[];
  // Route data (for map display)
  routeData?: DriverReservationRouteDataDto;
  // Rider info with privacy enforcement
  rider: DriverReservationRiderDto;
  // Derived trip window
  tripStartAt: string; // ISO
  tripEndAt: string; // ISO
  // Messaging info
  chatEnabled: boolean;
  // Driver report (optional, only if submitted)
  driverReport?: {
    content: string;
    submittedAt: string; // ISO
  };
  // Trip lifecycle timestamps
  startedAt?: string; // ISO
  completedAt?: string; // ISO
}

