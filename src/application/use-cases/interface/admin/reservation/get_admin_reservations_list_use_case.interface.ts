import { AdminReservationsListResponse } from '../../../../dtos/reservation.dto';
import { ReservationStatus } from '../../../../../shared/constants';

/**
 * Interface for getting admin reservations list use case
 */
export interface IGetAdminReservationsListUseCase {
  execute(
    page?: number,
    limit?: number,
    status?: ReservationStatus[],
    includeDeleted?: boolean,
    search?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<AdminReservationsListResponse>;
}

