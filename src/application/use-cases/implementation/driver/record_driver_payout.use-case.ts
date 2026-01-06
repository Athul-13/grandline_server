import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';

/**
 * Use case for recording a driver payout
 * Resets driver's total earnings to 0 and updates last payment date
 */
@injectable()
export class RecordDriverPayoutUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository
  ) {}

  async execute(driverId: string, paymentDate: Date): Promise<void> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    if (!paymentDate || !(paymentDate instanceof Date) || isNaN(paymentDate.getTime())) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    logger.info(`Recording payout for driver: ${driverId} on date: ${paymentDate.toISOString()}`);

    // Check if driver exists
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Record payout: reset totalEarnings to 0 and update lastPaymentDate
    await this.driverRepository.updateLastPaymentDate(driverId, paymentDate);

    logger.info(`Payout recorded for driver ${driverId}. Total earnings reset to 0.`);
  }
}

