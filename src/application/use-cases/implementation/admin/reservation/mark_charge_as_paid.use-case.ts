import { injectable, inject } from 'tsyringe';
import { IMarkChargeAsPaidUseCase } from '../../../interface/admin/reservation/mark_charge_as_paid_use_case.interface';
import { IReservationChargeRepository } from '../../../../../domain/repositories/reservation_charge_repository.interface';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { ReservationCharge } from '../../../../../domain/entities/reservation_charge.entity';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { ERROR_MESSAGES } from '../../../../../shared/constants';
import { logger } from '../../../../../shared/logger';

/**
 * Use case for marking a reservation charge as paid
 * Updates the charge status to paid and records the payment date
 */
@injectable()
export class MarkChargeAsPaidUseCase implements IMarkChargeAsPaidUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository
  ) {}

  async execute(chargeId: string, adminUserId: string): Promise<ReservationCharge> {
    // Input validation
    if (!chargeId || typeof chargeId !== 'string' || chargeId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CHARGE_ID', 400);
    }

    if (!adminUserId || typeof adminUserId !== 'string' || adminUserId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_ADMIN_USER_ID', 400);
    }

    // Find the charge
    const charge = await this.chargeRepository.findById(chargeId);

    if (!charge) {
      throw new AppError('Charge not found', 'CHARGE_NOT_FOUND', 404);
    }

    // Check if already paid
    if (charge.isPaid) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'CHARGE_ALREADY_PAID', 400);
    }

    // Update charge to paid
    const paidAt = new Date();
    await this.chargeRepository.updateById(chargeId, {
      isPaid: true,
      paidAt,
    });

    // Fetch updated charge
    const updatedCharge = await this.chargeRepository.findById(chargeId);

    if (!updatedCharge) {
      throw new AppError(ERROR_MESSAGES.SERVER_ERROR, 'FAILED_TO_UPDATE_CHARGE', 500);
    }

    logger.info(`Charge ${chargeId} marked as paid by admin ${adminUserId}`);

    return updatedCharge;
  }
}

