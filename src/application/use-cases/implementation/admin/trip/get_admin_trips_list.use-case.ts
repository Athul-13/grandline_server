import { injectable, inject } from 'tsyringe';
import { IGetAdminTripsListUseCase } from '../../../interface/admin/trip/get_admin_trips_list_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { IDriverRepository } from '../../../../../domain/repositories/driver_repository.interface';
import { IReservationItineraryRepository } from '../../../../../domain/repositories/reservation_itinerary_repository.interface';
import { AdminTripsListResponse, AdminTripListItemResponse, TripState } from '../../../../dtos/trip.dto';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { deriveTripWindow } from '../../../../mapper/driver_dashboard.mapper';
import { logger } from '../../../../../shared/logger';

/**
 * Allowed sort fields for admin trip sorting
 */
const ALLOWED_SORT_FIELDS: readonly string[] = [
  'tripStartAt',
  'tripEndAt',
  'startedAt',
  'completedAt',
  'tripName',
  'userName',
  'driverName',
] as const;

/**
 * Derives trip state based on reservation data
 * Uses derived logic, not stored status
 */
function deriveTripState(args: {
  completedAt?: Date;
  startedAt?: Date;
  tripStartAt: Date;
  tripEndAt: Date;
  now: Date;
}): TripState {
  // Priority 1: Explicit lifecycle (completedAt) → PAST
  if (args.completedAt) return 'PAST';

  // Priority 2: Explicit lifecycle (startedAt && !completedAt) → CURRENT
  if (args.startedAt && !args.completedAt) return 'CURRENT';

  // Priority 3: Time-based logic
  if (args.tripStartAt > args.now) return 'UPCOMING';

  // Priority 4: Legacy expired (completedAt == null && tripEndAt < now) → PAST
  if (!args.completedAt && args.tripEndAt < args.now) return 'PAST';

  // Default: CURRENT (trip has started but not completed, or is currently active)
  return 'CURRENT';
}

/**
 * Use case for getting admin trips list
 * Retrieves all trips with filtering, sorting, and pagination
 */
@injectable()
export class GetAdminTripsListUseCase implements IGetAdminTripsListUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository
  ) {}

  async execute(
    page: number = 1,
    limit: number = 20,
    state?: TripState,
    search?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<AdminTripsListResponse> {
    try {
      // Normalize pagination parameters
      const normalizedPage = Math.max(1, Math.floor(page) || 1);
      const normalizedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20));

      // Validate sortBy field
      const normalizedSortBy = sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : undefined;
      const normalizedSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      // Normalize search term
      const normalizedSearch = search && search.trim().length > 0 ? search.trim() : undefined;

      logger.info(
        `Admin trips list request: page=${normalizedPage}, limit=${normalizedLimit}, state=${state || 'all'}, search=${normalizedSearch || 'none'}`
      );

      const now = new Date();

      // Step 1: Get all reservations (we'll filter by search later if needed)
      // For trips, we want to include ALL trips including past ones
      let reservationIds: string[] = [];
      if (normalizedSearch) {
        // If search is provided, get reservations matching search query
        const { reservations: searchReservations } = await this.reservationRepository.findAllForAdmin(
          1,
          10000, // Get all matching reservations
          false, // includeDeleted
          undefined, // No status filter
          undefined, // No userIds filter
          normalizedSearch, // Search query
          false // excludePastTrips: false - we want all trips including past
        );
        reservationIds = searchReservations.map((r) => r.reservationId);
      } else {
        // Get all reservations
        const { reservations: allReservations } = await this.reservationRepository.findAllForAdmin(
          1,
          10000, // Get all reservations
          false, // includeDeleted
          undefined, // No status filter
          undefined, // No userIds filter
          undefined, // No search query
          false // excludePastTrips: false - we want all trips including past
        );
        reservationIds = allReservations.map((r) => r.reservationId);
      }

      // Step 2: Fetch reservations with full details
      const reservations = await Promise.all(
        reservationIds.map((id) => this.reservationRepository.findById(id))
      );
      const validReservations = reservations.filter((r): r is NonNullable<typeof r> => r !== null);

      // Step 3: Fetch itinerary for all reservations to derive tripStartAt/tripEndAt
      const tripWindowMap = new Map<string, { tripStartAt: Date; tripEndAt: Date }>();

      for (const reservation of validReservations) {
        const itineraryStops = await this.itineraryRepository.findByReservationIdOrdered(
          reservation.reservationId
        );
        if (itineraryStops.length > 0) {
          const { tripStartAt, tripEndAt } = deriveTripWindow(itineraryStops);
          tripWindowMap.set(reservation.reservationId, { tripStartAt, tripEndAt });
        }
      }

      // Step 4: Fetch user information for all reservations
      const userIds = [...new Set(validReservations.map((r) => r.userId))];
      const users = await Promise.all(userIds.map((userId) => this.userRepository.findById(userId)));
      const userMap = new Map<string, typeof users[0]>();
      userIds.forEach((userId, index) => {
        const user = users[index];
        if (user) {
          userMap.set(userId, user);
        }
      });

      // Step 5: Fetch driver information for reservations with assigned drivers
      const driverIds = [
        ...new Set(
          validReservations
            .map((r) => r.assignedDriverId)
            .filter((id): id is string => id !== undefined)
        ),
      ];
      const drivers = await Promise.all(
        driverIds.map((driverId) => this.driverRepository.findById(driverId))
      );
      const driverMap = new Map<string, typeof drivers[0]>();
      driverIds.forEach((driverId, index) => {
        const driver = drivers[index];
        if (driver) {
          driverMap.set(driverId, driver);
        }
      });

      // Step 6: Map to trip list items with derived state
      let tripItems: AdminTripListItemResponse[] = [];

      for (const reservation of validReservations) {
        const tripWindow = tripWindowMap.get(reservation.reservationId);
        if (!tripWindow) {
          // Skip reservations without itinerary
          continue;
        }

        const { tripStartAt, tripEndAt } = tripWindow;
        const derivedState = deriveTripState({
          completedAt: reservation.completedAt,
          startedAt: reservation.startedAt,
          tripStartAt,
          tripEndAt,
          now,
        });

        const legacyExpired = !reservation.completedAt && tripEndAt < now;

        const user = userMap.get(reservation.userId);
        const userName = user ? user.fullName : 'Unknown User';

        const driver = reservation.assignedDriverId
          ? driverMap.get(reservation.assignedDriverId)
          : undefined;
        const driverName = driver ? driver.fullName : undefined;

        // Apply state filter if provided
        if (state && derivedState !== state) {
          continue;
        }

        // Apply search filter (if not already filtered by repository)
        if (normalizedSearch) {
          const searchLower = normalizedSearch.toLowerCase();
          const matches =
            reservation.reservationId.toLowerCase().includes(searchLower) ||
            (reservation.tripName && reservation.tripName.toLowerCase().includes(searchLower)) ||
            userName.toLowerCase().includes(searchLower) ||
            (driverName && driverName.toLowerCase().includes(searchLower));

          if (!matches) {
            continue;
          }
        }

        // Apply 3-day cutoff filter: exclude trips beyond 3 days unless started or completed
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        if (
          tripStartAt > threeDaysFromNow &&
          !reservation.startedAt &&
          !reservation.completedAt
        ) {
          // Skip reservations starting beyond 3 days that haven't started or completed
          continue;
        }

        tripItems.push({
          reservationId: reservation.reservationId,
          tripName: reservation.tripName,
          userName,
          driverName,
          tripStartAt,
          tripEndAt,
          startedAt: reservation.startedAt,
          completedAt: reservation.completedAt,
          derivedTripState: derivedState,
          legacyExpired,
        });
      }

      // Step 7: Apply sorting
      if (normalizedSortBy) {
        tripItems = this.sortTrips(tripItems, normalizedSortBy, normalizedSortOrder);
      } else {
        // Default: sort by tripStartAt descending (upcoming first)
        tripItems = this.sortTrips(tripItems, 'tripStartAt', 'desc');
      }

      // Step 8: Calculate pagination
      const total = tripItems.length;
      const totalPages = Math.ceil(total / normalizedLimit);

      // Step 9: Apply pagination
      const startIndex = (normalizedPage - 1) * normalizedLimit;
      const endIndex = startIndex + normalizedLimit;
      const paginatedTrips = tripItems.slice(startIndex, endIndex);

      logger.info(`Admin trips list: returning ${paginatedTrips.length} trips out of ${total} total`);

      return {
        trips: paginatedTrips,
        pagination: {
          page: normalizedPage,
          limit: normalizedLimit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(
        `Error fetching admin trips list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Sorts trips array based on the specified field and order
   */
  private sortTrips(
    trips: AdminTripListItemResponse[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): AdminTripListItemResponse[] {
    return [...trips].sort((a, b) => {
      const aValue = a[sortBy as keyof AdminTripListItemResponse];
      const bValue = b[sortBy as keyof AdminTripListItemResponse];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // For other types, convert to string safely
      const aStr = typeof aValue === 'object' ? JSON.stringify(aValue) : String(aValue);
      const bStr = typeof bValue === 'object' ? JSON.stringify(bValue) : String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}

