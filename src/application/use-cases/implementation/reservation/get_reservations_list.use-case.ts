import { injectable, inject } from 'tsyringe';
import { IGetReservationsListUseCase } from '../../interface/reservation/get_reservations_list_use_case.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { ReservationListResponse } from '../../../dtos/reservation.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ReservationMapper } from '../../../mapper/reservation.mapper';
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
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ReservationListResponse> {
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

    // Map to response DTOs
    const reservationItems = reservations.map((reservation) =>
      ReservationMapper.toReservationListItemResponse(reservation)
    );

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

