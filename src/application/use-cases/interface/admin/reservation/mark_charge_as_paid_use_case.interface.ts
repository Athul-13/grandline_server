import { ReservationCharge } from '../../../../../domain/entities/reservation_charge.entity';

/**
 * Interface for marking a reservation charge as paid use case
 */
export interface IMarkChargeAsPaidUseCase {
  execute(chargeId: string, adminUserId: string): Promise<ReservationCharge>;
}

