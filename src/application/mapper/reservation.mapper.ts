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
    }>,
    passengers?: Array<{
      passengerId: string;
      fullName: string;
      phoneNumber: string;
      age: number;
    }>,
    charges?: Array<{
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
    }>,
    chatEnabled?: boolean
  ): ReservationResponse {
    return {
      reservationId: reservation.reservationId,
      userId: reservation.userId,
      quoteId: reservation.quoteId,
      paymentId: reservation.paymentId,
      reservationNumber: reservation.reservationNumber,
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
      passengers: passengers || undefined,
      charges: charges?.map((charge) => ({
        chargeId: charge.chargeId,
        reservationId: charge.reservationId,
        chargeType: charge.chargeType,
        description: charge.description,
        amount: charge.amount,
        currency: charge.currency,
        addedBy: charge.addedBy,
        isPaid: charge.isPaid,
        paidAt: charge.paidAt,
        createdAt: charge.createdAt,
      })) || undefined,
      chatEnabled: chatEnabled ?? false,
    };
  }

  static toReservationListItemResponse(
    reservation: Reservation
  ): ReservationListItemResponse {
    // Start and end locations are now populated from reservation_itinerary collection
    // in the use case layer, so we leave them undefined here
    let startLocation: string | undefined;
    let endLocation: string | undefined;

    return {
      reservationId: reservation.reservationId,
      tripName: reservation.tripName,
      reservationNumber: reservation.reservationNumber,
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

