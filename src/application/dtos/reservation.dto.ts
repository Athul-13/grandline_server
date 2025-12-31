import { ReservationStatus, TripType } from '../../shared/constants';
import { SelectedVehicleDto, AdminUserInfo } from './quote.dto';

/**
 * Original pricing snapshot response DTO
 */
export interface OriginalPricingResponse {
  total?: number;
  currency?: string;
  paidAt?: Date;
}

/**
 * Reservation response DTO
 */
export interface ReservationResponse {
  reservationId: string;
  userId: string;
  quoteId: string;
  paymentId: string;
  tripType: TripType;
  tripName?: string;
  eventType?: string;
  customEventType?: string;
  passengerCount?: number;
  status: ReservationStatus;
  selectedVehicles?: SelectedVehicleDto[];
  selectedAmenities?: string[];
  routeData?: {
    outbound?: { totalDistance?: number; totalDuration?: number; routeGeometry?: string };
    return?: { totalDistance?: number; totalDuration?: number; routeGeometry?: string };
  };
  assignedDriverId?: string;
  originalDriverId?: string;
  originalPricing?: OriginalPricingResponse;
  reservationDate: Date;
  confirmedAt?: Date;
  driverChangedAt?: Date;
  refundStatus?: 'none' | 'partial' | 'full';
  refundedAmount?: number;
  refundedAt?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  driver?: {
    driverId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    licenseNumber: string;
    profilePictureUrl: string;
  };
  itinerary?: Array<{
    itineraryId: string;
    tripType: 'outbound' | 'return';
    stopOrder: number;
    locationName: string;
    latitude: number;
    longitude: number;
    arrivalTime: Date | string;
    departureTime?: Date | string;
    stopType: string;
    isDriverStaying: boolean;
    stayingDuration?: number;
  }>;
  passengers?: Array<{
    passengerId: string;
    fullName: string;
    phoneNumber: string;
    age: number;
  }>;
  charges?: ReservationChargeResponse[];
  chatEnabled?: boolean;
}

/**
 * Reservation list item response DTO
 */
export interface ReservationListItemResponse {
  reservationId: string;
  tripName?: string;
  tripType: TripType;
  status: ReservationStatus;
  reservationDate: Date;
  tripDate?: Date; // Date of the trip (from first pickup stop's arrival time)
  startLocation?: string;
  endLocation?: string;
  originalPrice?: number;
  assignedDriverId?: string;
  createdAt: Date;
}

/**
 * Reservation list response DTO
 */
export interface ReservationListResponse {
  reservations: ReservationListItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Admin reservation list item response DTO
 * Extends ReservationListItemResponse with user information
 */
export interface AdminReservationListItemResponse extends ReservationListItemResponse {
  user: AdminUserInfo;
}

/**
 * Admin reservation list response DTO
 */
export interface AdminReservationsListResponse {
  reservations: AdminReservationListItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Reservation modification response DTO
 */
export interface ReservationModificationResponse {
  modificationId: string;
  reservationId: string;
  modifiedBy: string;
  modificationType: 'driver_change' | 'passenger_add' | 'vehicle_adjust' | 'status_change' | 'charge_add' | 'other';
  description: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Reservation charge response DTO
 */
export interface ReservationChargeResponse {
  chargeId: string;
  reservationId: string;
  chargeType: 'additional_passenger' | 'vehicle_upgrade' | 'amenity_add' | 'late_fee' | 'other';
  description: string;
  amount: number;
  currency: string;
  addedBy: string;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
}

/**
 * Admin reservation details response DTO
 * Extends ReservationResponse with additional admin-specific data
 */
export interface AdminReservationDetailsResponse extends ReservationResponse {
  user: AdminUserInfo;
  passengers?: Array<{
    passengerId: string;
    fullName: string;
    phoneNumber: string;
    age: number;
  }>;
  modifications?: ReservationModificationResponse[];
  charges?: ReservationChargeResponse[];
  totalCharges?: number;
  unpaidCharges?: number;
}

