import { injectable, inject } from 'tsyringe';
import { DashboardStatsResponse } from '../../../dtos/dashboard.dto';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { IGetDashboardStatsUseCase } from '../../interface/dashboard/get_dashboard_stats_use_case.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';

/**
 * Use case for getting dashboard statistics
 * Returns total rides, earnings, and rating for a driver
 */
@injectable()
export class GetDashboardStatsUseCase implements IGetDashboardStatsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(driverId: string): Promise<DashboardStatsResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    logger.info(`Dashboard stats fetch request for driver: ${driverId}`);

    // TODO: Implement actual statistics calculation
    // For now, return placeholder data
    // This should query reservations and calculate:
    // - totalRides: count of completed reservations
    // - earnings: sum of driver earnings from completed reservations
    // - rating: average rating from completed reservations

    return {
      totalRides: 0,
      earnings: 0,
      rating: 0,
    };
  }
}

