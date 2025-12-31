import { inject, injectable } from 'tsyringe';
import { IGetDriverDashboardUseCase } from '../../interface/driver/get_driver_dashboard_use_case.interface';
import { DriverDashboardRequestDto, DriverDashboardResponseDto, DriverTripCardDto } from '../../../dtos/driver_dashboard.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IReservationItineraryRepository } from '../../../../domain/repositories/reservation_itinerary_repository.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { DriverDashboardMapper, paginatePastTrips, VehicleWithQuantity } from '../../../mapper/driver_dashboard.mapper';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ERROR_MESSAGES } from '../../../../shared/constants';

const DEFAULT_PAST_LIMIT = 10;
const MAX_PAST_LIMIT = 50;

function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}

function clampInt(value: number, min: number, max: number): number {
  const v = Math.floor(value);
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function expandSelectedVehicles(
  reservations: readonly Reservation[],
  vehiclesById: Map<string, import('../../../../domain/entities/vehicle.entity').Vehicle>
): Map<string, VehicleWithQuantity[]> {
  const map = new Map<string, VehicleWithQuantity[]>();
  for (const r of reservations) {
    const selected = r.selectedVehicles ?? [];
    const expanded: VehicleWithQuantity[] = [];
    for (const s of selected) {
      const vehicle = vehiclesById.get(s.vehicleId);
      if (vehicle) {
        expanded.push({ vehicle, quantity: s.quantity });
      }
    }
    map.set(r.reservationId, expanded);
  }
  return map;
}

function byTripStartAsc(a: DriverTripCardDto, b: DriverTripCardDto): number {
  return new Date(a.tripStartAt).getTime() - new Date(b.tripStartAt).getTime();
}

function byTripEndDescThenIdDesc(a: DriverTripCardDto, b: DriverTripCardDto): number {
  const endDiff = new Date(b.tripEndAt).getTime() - new Date(a.tripEndAt).getTime();
  if (endDiff !== 0) return endDiff;
  return b.reservationId.localeCompare(a.reservationId);
}

@injectable()
export class GetDriverDashboardUseCase implements IGetDriverDashboardUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository
  ) {}

  async execute(driverId: string, request: DriverDashboardRequestDto): Promise<DriverDashboardResponseDto> {
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_DRIVER_ID', 400);
    }

    const now = new Date();
    const pastLimit = clampInt(request.pastLimit ?? DEFAULT_PAST_LIMIT, 1, MAX_PAST_LIMIT);
    const pastCursor = DriverDashboardMapper.decodePastCursor(request.pastCursor);

    // 1) Fetch all reservations assigned to driver
    const reservations = await this.reservationRepository.findByAssignedDriverId(driverId);

    // 2) Batch-load itinerary, users, vehicles
    const reservationIds = reservations.map((r) => r.reservationId);
    const itineraryByResId = await this.itineraryRepository.findByReservationIdsOrdered(reservationIds);

    const userIds = unique(reservations.map((r) => r.userId));
    const usersById = await this.userRepository.findByIds(userIds);

    const vehicleIds = unique(
      reservations.flatMap((r) => (r.selectedVehicles ?? []).map((sv) => sv.vehicleId))
    );
    const vehiclesById = await this.vehicleRepository.findByIds(vehicleIds);
    const expandedVehiclesByReservationId = expandSelectedVehicles(reservations, vehiclesById);

    // 3) Map to trip cards (derive tripState, privacy, chatEnabled)
    const tripCards: DriverTripCardDto[] = [];
    for (const reservation of reservations) {
      const stops = itineraryByResId.get(reservation.reservationId) ?? [];
      const rider = usersById.get(reservation.userId);
      if (!rider) {
        // Data integrity issue; skip instead of failing whole dashboard
        continue;
      }
      const vehicles = expandedVehiclesByReservationId.get(reservation.reservationId) ?? [];
      tripCards.push(
        DriverDashboardMapper.toTripCard({
          reservation,
          itineraryStops: stops,
          rider,
          vehicles,
          now,
        })
      );
    }

    // 4) Group and sort
    const currentCandidates = tripCards
      .filter((t) => t.tripState === 'CURRENT')
      .sort(byTripStartAsc);

    const upcomingTrips = tripCards
      .filter((t) => t.tripState === 'UPCOMING')
      .sort(byTripStartAsc);

    // Past includes terminal statuses OR ended in the past (already derived by mapper)
    const pastTripsAll = tripCards
      .filter((t) => t.tripState === 'PAST')
      .sort(byTripEndDescThenIdDesc);

    const currentTrip = currentCandidates[0] ?? null;

    const { pageItems, nextCursor, hasMore } = paginatePastTrips({
      items: pastTripsAll,
      cursor: pastCursor,
      limit: pastLimit,
    });

    return {
      serverTime: now.toISOString(),
      currentTrip,
      upcomingTrips,
      pastTrips: {
        items: pageItems,
        nextCursor,
        hasMore,
      },
    };
  }
}


