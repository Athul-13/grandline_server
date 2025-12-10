import { Reservation } from '../../domain/entities/reservation.entity';
import {
  ReservationResponse,
  ReservationListItemResponse,
} from '../dtos/reservation.dto';

/**
 * Reservation mapper
 * Converts domain entities to DTOs
 */
export class ReservationMapper {
  static toReservationResponse(
    reservation: Reservation,
    driverDetails?: {
      driverId: string;
      fullName: string;
      email: string;
      phoneNumber: string;
      licenseNumber: string;
      profilePictureUrl: string;
    } | null,
    itineraryStops?: Array<{
      itineraryId: string;
      tripType: 'outbound' | 'return';
      stopOrder: number;
      locationName: string;
      latitude: number;
      longitude: number;
      arrivalTime: Date;
      departureTime?: Date;
      stopType: string;
      isDriverStaying: boolean;
      stayingDuration?: number;
    }>
  ): ReservationResponse {
    return {
      reservationId: reservation.reservationId,
      userId: reservation.userId,
      quoteId: reservation.quoteId,
      paymentId: reservation.paymentId,
      tripType: reservation.tripType,
      tripName: reservation.tripName,
      eventType: reservation.eventType,
      customEventType: reservation.customEventType,
      passengerCount: reservation.passengerCount,
      status: reservation.status,
      selectedVehicles: reservation.selectedVehicles?.map((v) => ({
        vehicleId: v.vehicleId,
        quantity: v.quantity,
      })),
      selectedAmenities: reservation.selectedAmenities,
      routeData: reservation.routeData,
      assignedDriverId: reservation.assignedDriverId,
      originalDriverId: reservation.originalDriverId,
      originalPricing: reservation.originalPricing,
      reservationDate: reservation.reservationDate,
      confirmedAt: reservation.confirmedAt,
      driverChangedAt: reservation.driverChangedAt,
      refundStatus: reservation.refundStatus,
      refundedAmount: reservation.refundedAmount,
      refundedAt: reservation.refundedAt,
      cancellationReason: reservation.cancellationReason,
      cancelledAt: reservation.cancelledAt,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      driver: driverDetails || undefined,
      itinerary: itineraryStops || undefined,
    };
  }

  static toReservationListItemResponse(
    reservation: Reservation
  ): ReservationListItemResponse {
    // Extract start and end locations from route data
    // Note: For Phase 1, we'll extract from routeData if available
    // In Phase 2, we'll get this from reservation_itinerary collection
    let startLocation: string | undefined;
    let endLocation: string | undefined;

    // For now, we'll leave these empty as itinerary will be in separate collection
    // They can be populated in Phase 2 when we fetch from reservation_itinerary

    return {
      reservationId: reservation.reservationId,
      tripName: reservation.tripName,
      tripType: reservation.tripType,
      status: reservation.status,
      reservationDate: reservation.reservationDate,
      startLocation,
      endLocation,
      originalPrice: reservation.originalPricing?.total,
      assignedDriverId: reservation.assignedDriverId,
      createdAt: reservation.createdAt,
    };
  }
}

