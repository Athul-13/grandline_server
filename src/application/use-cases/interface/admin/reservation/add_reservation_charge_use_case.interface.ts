import { ReservationCharge } from '../../../../../domain/entities/reservation_charge.entity';

/**
 * Interface for adding charge to reservation use case
 */
export interface IAddReservationChargeUseCase {
  execute(
    reservationId: string,
    chargeType: ReservationCharge['chargeType'],
    description: string,
    amount: number,
    adminUserId: string,
    currency?: string
  ): Promise<ReservationCharge>;
}

