import { injectable, inject } from 'tsyringe';
import { IGetReservationsListUseCase, ReservationDropdownItem } from '../../interface/reservation/get_reservations_list_use_case.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IReservationItineraryRepository } from '../../../../domain/repositories/reservation_itinerary_repository.interface';
import { ReservationListResponse, ReservationListItemResponse } from '../../../dtos/reservation.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ReservationMapper } from '../../../mapper/reservation.mapper';
import { TripType, StopType } from '../../../../shared/constants';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting reservations list
 * Retrieves all reservations for a user with pagination
 */
@injectable()
export class GetReservationsListUseCase implements IGetReservationsListUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 20,
    forDropdown: boolean = false
  ): Promise<ReservationListResponse | ReservationDropdownItem[]> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    // Normalize pagination parameters
    const normalizedPage = Math.max(1, Math.floor(page) || 1);
    const normalizedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20));

    // Get reservations with pagination
    const { reservations, total } = await this.reservationRepository.findByUserId(
      userId,
      normalizedPage,
      normalizedLimit
    );

    // If forDropdown is true, return minimal data without pagination
    if (forDropdown) {
      //Filter to only include reservations with tripname 
      const { reservations: reservationsWithTripName, total: totalWithTripName } = await this.reservationRepository.findByUserId(
        userId,
        1,
        1000
      );
      const dropdownItems: ReservationDropdownItem[] = reservationsWithTripName.map((reservation) => ({
        reservationId: reservation.reservationId,
        tripName: reservation.tripName!,
        status: reservation.status,
      }));
      return dropdownItems
    }

    // Fetch itinerary for start/end locations
    const reservationIds = reservations.map((r) => r.reservationId);
    const allItineraryStops = await Promise.all(
      reservationIds.map((id) => this.itineraryRepository.findByReservationIdOrdered(id))
    );

    // Create map for quick lookup
    const itineraryMap = new Map<string, typeof allItineraryStops[0]>();
    reservationIds.forEach((id, index) => {
      itineraryMap.set(id, allItineraryStops[index]);
    });

    // Map to response DTOs with start/end locations
    const reservationItems: ReservationListItemResponse[] = reservations.map((reservation) => {
      const itineraryStops = itineraryMap.get(reservation.reservationId) || [];
      const listItem = ReservationMapper.toReservationListItemResponse(reservation);

      // Extract start and end locations from itinerary, and trip date
      if (itineraryStops.length > 0) {
        const outboundStops = itineraryStops
          .filter((stop) => stop.tripType === 'outbound')
          .sort((a, b) => a.stopOrder - b.stopOrder);

        const pickupStop = outboundStops.find((stop) => stop.stopType === StopType.PICKUP);
        if (pickupStop) {
          listItem.startLocation = pickupStop.locationName;
          // Trip date is the first pickup stop's arrival time
          listItem.tripDate = pickupStop.arrivalTime;
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

      return listItem;
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / normalizedLimit);

    return {
      reservations: reservationItems,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    };
  }
}

