import { injectable, inject } from 'tsyringe';
import { RecentActivityResponse } from '../../../dtos/dashboard.dto';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { IGetRecentActivityUseCase } from '../../interface/dashboard/get_recent_activity_use_case.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';

/**
 * Use case for getting recent activity
 * Returns recent reservations and activities for a driver
 */
@injectable()
export class GetRecentActivityUseCase implements IGetRecentActivityUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(driverId: string): Promise<RecentActivityResponse[]> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    logger.info(`Recent activity fetch request for driver: ${driverId}`);

    // TODO: Implement actual activity retrieval
    // For now, return empty array
    // This should query recent reservations and return:
    // - id: reservation ID
    // - type: activity type (e.g., 'reservation', 'payment', etc.)
    // - date: activity date
    // - amount: optional amount (for payments/earnings)

    return [];
  }
}

