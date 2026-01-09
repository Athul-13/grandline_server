import {
  DriverReservationDetailsResponse,
  DriverReservationItineraryStopDto,
  DriverReservationVehicleDto,
  DriverReservationRiderDto,
} from '../dtos/driver_reservation.dto';
import { Reservation } from '../../domain/entities/reservation.entity';
import { ReservationItinerary } from '../../domain/entities/reservation_itinerary.entity';
import { User } from '../../domain/entities/user.entity';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { derivePrivacy, deriveTripWindow, deriveTripState, deriveChatEnabled } from './driver_dashboard.mapper';

export interface VehicleWithQuantity {
  readonly vehicle: Vehicle;
  readonly quantity: number;
}

export interface ToDriverReservationDetailsInput {
  readonly reservation: Reservation;
  readonly itineraryStops: readonly ReservationItinerary[];
  readonly rider: User;
  readonly vehicles: readonly VehicleWithQuantity[];
  readonly now: Date;
}

/**
 * Mapper for driver reservation details
 * Converts domain entities to driver-safe DTO
 */
export class DriverReservationMapper {
  static toDriverReservationDetails(
    input: ToDriverReservationDetailsInput
  ): DriverReservationDetailsResponse {
    const { tripStartAt, tripEndAt } = deriveTripWindow(input.itineraryStops);
    const tripState = deriveTripState({
      status: input.reservation.status,
      tripStartAt,
      tripEndAt,
      now: input.now,
      startedAt: input.reservation.startedAt,
      completedAt: input.reservation.completedAt,
    });
    const privacy = derivePrivacy(tripStartAt, input.now);
    const chatEnabled = deriveChatEnabled(tripStartAt, input.now, tripState);

    // Map itinerary stops (full list, ordered)
    const itinerary: DriverReservationItineraryStopDto[] = input.itineraryStops.map((stop) => ({
      itineraryId: stop.itineraryId,
      tripType: stop.tripType,
      stopOrder: stop.stopOrder,
      locationName: stop.locationName,
      latitude: stop.latitude,
      longitude: stop.longitude,
      arrivalTime: stop.arrivalTime.toISOString(),
      departureTime: stop.departureTime?.toISOString(),
      stopType: stop.stopType,
      isDriverStaying: stop.isDriverStaying,
      stayingDuration: stop.stayingDuration,
    }));

    // Map vehicles (expanded, no images)
    const vehicles: DriverReservationVehicleDto[] = input.vehicles.map((v) => ({
      vehicleId: v.vehicle.vehicleId,
      vehicleModel: v.vehicle.vehicleModel,
      plateNumber: v.vehicle.plateNumber,
      quantity: v.quantity,
    }));

    // Map rider with privacy enforcement
    const riderBase: Omit<DriverReservationRiderDto, 'privacy'> = {
      userId: input.rider.userId,
      fullName: input.rider.fullName,
    };

    const rider: DriverReservationRiderDto =
      privacy === 'FULL'
        ? {
            ...riderBase,
            privacy,
            email: input.rider.email,
            phoneNumber: input.rider.phoneNumber,
          }
        : {
            ...riderBase,
            privacy,
          };

    // Map route data (if exists)
    const routeData = input.reservation.routeData
      ? {
          outbound: input.reservation.routeData.outbound
            ? {
                totalDistance: input.reservation.routeData.outbound.totalDistance,
                totalDuration: input.reservation.routeData.outbound.totalDuration,
                routeGeometry: input.reservation.routeData.outbound.routeGeometry,
              }
            : undefined,
          return: input.reservation.routeData.return
            ? {
                totalDistance: input.reservation.routeData.return.totalDistance,
                totalDuration: input.reservation.routeData.return.totalDuration,
                routeGeometry: input.reservation.routeData.return.routeGeometry,
              }
            : undefined,
        }
      : undefined;

    return {
      reservationId: input.reservation.reservationId,
      status: input.reservation.status,
      tripType: input.reservation.tripType,
      tripName: input.reservation.tripName,
      eventType: input.reservation.eventType,
      customEventType: input.reservation.customEventType,
      passengerCount: input.reservation.passengerCount,
      selectedAmenities: input.reservation.selectedAmenities,
      reservationDate: input.reservation.reservationDate.toISOString(),
      confirmedAt: input.reservation.confirmedAt?.toISOString(),
      driverChangedAt: input.reservation.driverChangedAt?.toISOString(),
      cancellationReason: input.reservation.cancellationReason,
      cancelledAt: input.reservation.cancelledAt?.toISOString(),
      createdAt: input.reservation.createdAt.toISOString(),
      updatedAt: input.reservation.updatedAt.toISOString(),
      vehicles,
      itinerary,
      routeData,
      rider,
      tripStartAt: tripStartAt.toISOString(),
      tripEndAt: tripEndAt.toISOString(),
      chatEnabled,
      driverReport: input.reservation.driverReport
        ? {
            content: input.reservation.driverReport.content,
            submittedAt: input.reservation.driverReport.submittedAt.toISOString(),
          }
        : undefined,
      startedAt: input.reservation.startedAt?.toISOString(),
      completedAt: input.reservation.completedAt?.toISOString(),
    };
  }
}

