import { injectable, inject } from 'tsyringe';
import { IGetAdminReservationsListUseCase } from '../../../interface/admin/reservation/get_admin_reservations_list_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { IReservationItineraryRepository } from '../../../../../domain/repositories/reservation_itinerary_repository.interface';
import { AdminReservationsListResponse, AdminReservationListItemResponse } from '../../../../dtos/reservation.dto';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { ReservationMapper } from '../../../../mapper/reservation.mapper';
import { ReservationStatus, TripType, StopType } from '../../../../../shared/constants';
import { logger } from '../../../../../shared/logger';

/**
 * Allowed sort fields for admin reservation sorting
 */
const ALLOWED_SORT_FIELDS: readonly string[] = [
  'createdAt',
  'updatedAt',
  'status',
  'reservationDate',
  'originalPrice',
] as const;

/**
 * Use case for getting admin reservations list
 * Retrieves all reservations with filtering, sorting, and pagination
 */
@injectable()
export class GetAdminReservationsListUseCase implements IGetAdminReservationsListUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository
  ) {}

  async execute(
    page: number = 1,
    limit: number = 20,
    status?: ReservationStatus[],
    _includeDeleted: boolean = false,
    search?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<AdminReservationsListResponse> {
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
        `Admin reservations list request: page=${normalizedPage}, limit=${normalizedLimit}, status=${status?.join(',') || 'all'}, search=${normalizedSearch || 'none'}`
      );

      // Get reservations with filters
      const { reservations } = await this.reservationRepository.findAllForAdmin(
        normalizedPage,
        normalizedLimit,
        false, // includeDeleted
        status,
        undefined, // userIds (will be filtered by search if provided)
        normalizedSearch
      );

      // If search is provided, also filter by user name/email
      let filteredReservations = reservations;
      if (normalizedSearch && normalizedSearch.length > 0) {
        const searchLower = normalizedSearch.toLowerCase();
        const allUsers = await this.userRepository.findAll();
        const matchingUserIds = allUsers
          .filter(
            (user) =>
              user.fullName.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)
          )
          .map((user) => user.userId);

        if (matchingUserIds.length > 0) {
          // Get reservations for matching users
          const { reservations: userReservations } = await this.reservationRepository.findAllForAdmin(
            normalizedPage,
            normalizedLimit,
            false,
            status,
            matchingUserIds,
            undefined // Don't search again
          );
          // Combine and deduplicate
          const existingIds = new Set(filteredReservations.map((r) => r.reservationId));
          const additional = userReservations.filter((r) => !existingIds.has(r.reservationId));
          filteredReservations = [...filteredReservations, ...additional];
        } else {
          // No matching users, return empty
          filteredReservations = [];
        }
      }

      // Fetch itinerary for start/end locations
      const reservationIds = filteredReservations.map((r) => r.reservationId);
      const allItineraryStops = await Promise.all(
        reservationIds.map((id) => this.itineraryRepository.findByReservationIdOrdered(id))
      );

      // Create map for quick lookup
      const itineraryMap = new Map<string, typeof allItineraryStops[0]>();
      reservationIds.forEach((id, index) => {
        itineraryMap.set(id, allItineraryStops[index]);
      });

      // Fetch user information for all reservations
      const userIds = [...new Set(filteredReservations.map((r) => r.userId))];
      const users = await Promise.all(
        userIds.map((userId) => this.userRepository.findById(userId))
      );
      const userMap = new Map<string, typeof users[0]>();
      userIds.forEach((userId, index) => {
        const user = users[index];
        if (user) {
          userMap.set(userId, user);
        }
      });

      // Map to response DTOs
      let reservationItems: AdminReservationListItemResponse[] = filteredReservations.map(
        (reservation) => {
          const itineraryStops = itineraryMap.get(reservation.reservationId) || [];
          const listItem = ReservationMapper.toReservationListItemResponse(reservation);

          // Extract start and end locations from itinerary
          if (itineraryStops.length > 0) {
            const outboundStops = itineraryStops
              .filter((stop) => stop.tripType === 'outbound')
              .sort((a, b) => a.stopOrder - b.stopOrder);

            const pickupStop = outboundStops.find((stop) => stop.stopType === StopType.PICKUP);
            if (pickupStop) {
              listItem.startLocation = pickupStop.locationName;
            }

            if (reservation.tripType === TripType.ONE_WAY) {
              const dropoffStops = outboundStops.filter((stop) => stop.stopType === StopType.DROPOFF);
              if (dropoffStops.length > 0) {
                listItem.endLocation = dropoffStops[dropoffStops.length - 1].locationName;
              }
            } else {
              const returnStops = itineraryStops
                .filter((stop) => stop.tripType === 'return')
                .sort((a, b) => a.stopOrder - b.stopOrder);
              const dropoffStops = returnStops.filter((stop) => stop.stopType === StopType.DROPOFF);
              if (dropoffStops.length > 0) {
                listItem.endLocation = dropoffStops[dropoffStops.length - 1].locationName;
              }
            }
          }

          const user = userMap.get(reservation.userId);
          return {
            ...listItem,
            user: user
              ? {
                  userId: user.userId,
                  fullName: user.fullName,
                  email: user.email,
                  phoneNumber: user.phoneNumber,
                }
              : {
                  userId: reservation.userId,
                  fullName: 'Unknown User',
                  email: '',
                },
          };
        }
      );

      // Apply sorting if sortBy is provided
      if (normalizedSortBy) {
        reservationItems = this.sortReservations(reservationItems, normalizedSortBy, normalizedSortOrder);
      }

      // Calculate pagination
      const totalFiltered = reservationItems.length;
      const totalPages = Math.ceil(totalFiltered / normalizedLimit);

      // Apply pagination
      const startIndex = (normalizedPage - 1) * normalizedLimit;
      const endIndex = startIndex + normalizedLimit;
      const paginatedReservations = reservationItems.slice(startIndex, endIndex);

      return {
        reservations: paginatedReservations,
        pagination: {
          page: normalizedPage,
          limit: normalizedLimit,
          total: totalFiltered,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(
        `Error fetching admin reservations list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Sorts reservations array based on the specified field and order
   */
  private sortReservations(
    reservations: AdminReservationListItemResponse[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): AdminReservationListItemResponse[] {
    return [...reservations].sort((a, b) => {
      const aValue = a[sortBy as keyof AdminReservationListItemResponse];
      const bValue = b[sortBy as keyof AdminReservationListItemResponse];

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

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
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

