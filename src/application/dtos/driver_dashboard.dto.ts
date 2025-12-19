import { ReservationStatus, StopType, TripType } from '../../shared/constants';

export type DriverTripState = 'CURRENT' | 'UPCOMING' | 'PAST';
export type RiderPrivacy = 'NAME_ONLY' | 'FULL';

export interface DriverDashboardRequestDto {
  pastCursor?: string;
  pastLimit?: number;
}

export interface DriverDashboardResponseDto {
  serverTime: string; // ISO
  currentTrip: DriverTripCardDto | null;
  upcomingTrips: DriverTripCardDto[];
  pastTrips: {
    items: DriverTripCardDto[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface DriverTripStopDto {
  label: string;
  lat: number;
  lng: number;
  time: string; // ISO
  stopType: StopType;
  tripType: 'outbound' | 'return';
  stopOrder: number;
}

export interface DriverTripRiderDto {
  userId: string;
  fullName: string;
  privacy: RiderPrivacy;
  email?: string;
  phoneNumber?: string;
}

export interface DriverTripVehicleDto {
  vehicleId: string;
  vehicleModel: string;
  plateNumber: string;
  quantity: number;
}

export interface DriverTripMessagingDto {
  chatEnabled: boolean;
  contextType: 'reservation';
  contextId: string; // reservationId
}

export interface DriverTripCardDto {
  reservationId: string;
  status: ReservationStatus;
  tripType: TripType;
  tripState: DriverTripState;
  tripStartAt: string; // ISO
  tripEndAt: string; // ISO
  pickup: DriverTripStopDto;
  dropoff: DriverTripStopDto;
  rider: DriverTripRiderDto;
  vehicles: DriverTripVehicleDto[];
  messaging: DriverTripMessagingDto;
}


