import { ReservationListResponse } from '../../../dtos/reservation.dto';
import { ReservationStatus } from '../../../../shared/constants';

/**
 * Minimal reservation dropdown response
 */
export interface ReservationDropdownItem {
  reservationId: string;
  tripName: string;
  status: ReservationStatus;
}

/**
 * Interface for getting reservations list use case
 */
export interface IGetReservationsListUseCase {
  execute(
    userId: string,
    page?: number,
    limit?: number,
    forDropdown?: boolean
  ): Promise<ReservationListResponse | ReservationDropdownItem[]>;
}

