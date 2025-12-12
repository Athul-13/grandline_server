import { injectable, inject } from 'tsyringe';
import { IGetReservationChargesUseCase } from '../../../interface/admin/reservation/get_reservation_charges_use_case.interface';
import { IReservationChargeRepository } from '../../../../../domain/repositories/reservation_charge_repository.interface';
import { ReservationCharge } from '../../../../../domain/entities/reservation_charge.entity';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';

/**
 * Use case for getting reservation charges
 * Returns all charges for a reservation
 */
@injectable()
export class GetReservationChargesUseCase implements IGetReservationChargesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository
  ) {}

  async execute(reservationId: string): Promise<ReservationCharge[]> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Fetch charges
    const charges = await this.chargeRepository.findByReservationId(reservationId);

    logger.info(`Retrieved ${charges.length} charges for reservation: ${reservationId}`);

    return charges;
  }
}

