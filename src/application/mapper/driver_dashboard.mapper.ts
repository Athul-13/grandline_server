import {
  DriverTripCardDto,
  DriverTripState,
  RiderPrivacy,
} from '../dtos/driver_dashboard.dto';
import { Reservation } from '../../domain/entities/reservation.entity';
import { ReservationItinerary } from '../../domain/entities/reservation_itinerary.entity';
import { User } from '../../domain/entities/user.entity';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { ReservationStatus, StopType, TripType } from '../../shared/constants';

export interface VehicleWithQuantity {
  readonly vehicle: Vehicle;
  readonly quantity: number;
}

export interface ToDriverTripCardInput {
  readonly reservation: Reservation;
  readonly itineraryStops: readonly ReservationItinerary[];
  readonly rider: User;
  readonly vehicles: readonly VehicleWithQuantity[];
  readonly now: Date;
}

type PastCursorPayload = {
  readonly tripEndAt: string; // ISO
  readonly reservationId: string;
};

const TERMINAL_STATUSES = new Set<ReservationStatus>([
  ReservationStatus.CANCELLED,
  ReservationStatus.COMPLETED,
  ReservationStatus.REFUNDED,
]);

const MS_24H = 24 * 60 * 60 * 1000;

function encodeCursor(payload: PastCursorPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf8').toString('base64');
}

function decodeCursor(cursor: string): PastCursorPayload | null {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'tripEndAt' in parsed &&
      'reservationId' in parsed &&
      typeof (parsed as { tripEndAt: unknown }).tripEndAt === 'string' &&
      typeof (parsed as { reservationId: unknown }).reservationId === 'string'
    ) {
      return {
        tripEndAt: (parsed as { tripEndAt: string }).tripEndAt,
        reservationId: (parsed as { reservationId: string }).reservationId,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function minDate(dates: readonly Date[]): Date {
  let min = dates[0];
  for (let i = 1; i < dates.length; i++) {
    if (dates[i].getTime() < min.getTime()) min = dates[i];
  }
  return min;
}

function maxDate(dates: readonly Date[]): Date {
  let max = dates[0];
  for (let i = 1; i < dates.length; i++) {
    if (dates[i].getTime() > max.getTime()) max = dates[i];
  }
  return max;
}

export function deriveTripWindow(stops: readonly ReservationItinerary[]): {
  tripStartAt: Date;
  tripEndAt: Date;
} {
  if (!stops || stops.length === 0) {
    // Per requirements itinerary exists; keep safe.
    const now = new Date();
    return { tripStartAt: now, tripEndAt: now };
  }
  const tripStartAt = minDate(stops.map((s) => s.arrivalTime));
  const tripEndAt = maxDate(stops.map((s) => s.departureTime ?? s.arrivalTime));
  return { tripStartAt, tripEndAt };
}

export function deriveTripState(args: {
  status: ReservationStatus;
  tripStartAt: Date;
  tripEndAt: Date;
  now: Date;
  startedAt?: Date;
  completedAt?: Date;
}): DriverTripState {
  // Priority 1: Explicit lifecycle (completedAt) → PAST
  if (args.completedAt) return 'PAST';
  
  // Priority 2: Explicit lifecycle (startedAt) → CURRENT
  if (args.startedAt) return 'CURRENT';
  
  // Priority 3: Fallback to time-based logic (backward compatibility)
  if (TERMINAL_STATUSES.has(args.status)) return 'PAST';
  if (args.tripEndAt.getTime() < args.now.getTime()) return 'PAST';
  if (args.tripStartAt.getTime() > args.now.getTime()) return 'UPCOMING';
  return 'CURRENT';
}

export function isWithin24HoursOfStart(tripStartAt: Date, now: Date): boolean {
  return now.getTime() >= tripStartAt.getTime() - MS_24H;
}

export function derivePrivacy(tripStartAt: Date, now: Date): RiderPrivacy {
  return isWithin24HoursOfStart(tripStartAt, now) ? 'FULL' : 'NAME_ONLY';
}

export function deriveChatEnabled(tripStartAt: Date, now: Date, tripState: DriverTripState): boolean {
  return isWithin24HoursOfStart(tripStartAt, now) && tripState !== 'PAST';
}

function pickPickupStop(stops: readonly ReservationItinerary[]): ReservationItinerary {
  const outbound = stops
    .filter((s) => s.tripType === 'outbound')
    .sort((a, b) => a.stopOrder - b.stopOrder);
  const pickup = outbound.find((s) => s.stopType === StopType.PICKUP);
  return pickup ?? outbound[0] ?? stops[0];
}

function pickDropoffStop(stops: readonly ReservationItinerary[], tripType: TripType): ReservationItinerary {
  if (tripType === TripType.TWO_WAY) {
    const ret = stops
      .filter((s) => s.tripType === 'return')
      .sort((a, b) => a.stopOrder - b.stopOrder);
    const dropoffs = ret.filter((s) => s.stopType === StopType.DROPOFF);
    return dropoffs[dropoffs.length - 1] ?? ret[ret.length - 1] ?? stops[stops.length - 1];
  }

  const outbound = stops
    .filter((s) => s.tripType === 'outbound')
    .sort((a, b) => a.stopOrder - b.stopOrder);
  const dropoffs = outbound.filter((s) => s.stopType === StopType.DROPOFF);
  return dropoffs[dropoffs.length - 1] ?? outbound[outbound.length - 1] ?? stops[stops.length - 1];
}

export class DriverDashboardMapper {
  static toTripCard(input: ToDriverTripCardInput): DriverTripCardDto {
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

    const pickup = pickPickupStop(input.itineraryStops);
    const dropoff = pickDropoffStop(input.itineraryStops, input.reservation.tripType);

    const riderBase = {
      userId: input.rider.userId,
      fullName: input.rider.fullName,
      privacy,
    } as const;

    return {
      reservationId: input.reservation.reservationId,
      status: input.reservation.status,
      tripType: input.reservation.tripType,
      tripState,
      tripName: input.reservation.tripName,
      tripStartAt: tripStartAt.toISOString(),
      tripEndAt: tripEndAt.toISOString(),
      pickup: {
        label: pickup.locationName,
        lat: pickup.latitude,
        lng: pickup.longitude,
        time: pickup.arrivalTime.toISOString(),
        stopType: pickup.stopType,
        tripType: pickup.tripType,
        stopOrder: pickup.stopOrder,
      },
      dropoff: {
        label: dropoff.locationName,
        lat: dropoff.latitude,
        lng: dropoff.longitude,
        time: (dropoff.departureTime ?? dropoff.arrivalTime).toISOString(),
        stopType: dropoff.stopType,
        tripType: dropoff.tripType,
        stopOrder: dropoff.stopOrder,
      },
      rider:
        privacy === 'FULL'
          ? {
              ...riderBase,
              email: input.rider.email,
              phoneNumber: input.rider.phoneNumber,
            }
          : riderBase,
      vehicles: input.vehicles.map((v) => ({
        vehicleId: v.vehicle.vehicleId,
        vehicleModel: v.vehicle.vehicleModel,
        plateNumber: v.vehicle.plateNumber,
        quantity: v.quantity,
      })),
      messaging: {
        chatEnabled,
        contextType: 'reservation',
        contextId: input.reservation.reservationId,
      },
    };
  }

  static decodePastCursor(cursor?: string): PastCursorPayload | null {
    if (!cursor) return null;
    return decodeCursor(cursor);
  }

  static encodePastCursor(payload: PastCursorPayload): string {
    return encodeCursor(payload);
  }
}

export function paginatePastTrips(args: {
  items: readonly DriverTripCardDto[];
  cursor: PastCursorPayload | null;
  limit: number;
}): { pageItems: DriverTripCardDto[]; nextCursor: string | null; hasMore: boolean } {
  const limit = Math.max(1, Math.min(50, Math.floor(args.limit)));
  let startIndex = 0;

  if (args.cursor) {
    startIndex = args.items.findIndex(
      (t) => t.tripEndAt === args.cursor?.tripEndAt && t.reservationId === args.cursor?.reservationId
    );
    startIndex = startIndex >= 0 ? startIndex + 1 : 0;
  }

  const pageItems = args.items.slice(startIndex, startIndex + limit);
  const last = pageItems[pageItems.length - 1];
  const hasMore = startIndex + limit < args.items.length;
  const nextCursor = last
    ? DriverDashboardMapper.encodePastCursor({ tripEndAt: last.tripEndAt, reservationId: last.reservationId })
    : null;

  return { pageItems, nextCursor, hasMore };
}


