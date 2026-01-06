import { injectable, inject } from 'tsyringe';
import { DashboardStatsResponse } from '../../../dtos/dashboard.dto';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { IGetDashboardStatsUseCase } from '../../interface/dashboard/get_dashboard_stats_use_case.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ReservationStatus } from '../../../../shared/constants';

/**
 * Use case for getting dashboard statistics
 * Returns total rides, earnings, and rating for a driver
 */
@injectable()
export class GetDashboardStatsUseCase implements IGetDashboardStatsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository
  ) {}

  async execute(driverId: string): Promise<DashboardStatsResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    logger.info(`Dashboard stats fetch request for driver: ${driverId}`);

    // Fetch driver to get total earnings
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Get all reservations for this driver
    const reservations = await this.reservationRepository.findByAssignedDriverId(driverId);

    // Count completed reservations
    const completedReservations = reservations.filter(
      (r) => r.status === ReservationStatus.COMPLETED && r.completedAt !== undefined
    );
    const totalRides = completedReservations.length;

    // Get total earnings from driver entity (totalEarnings field)
    const earnings = driver.totalEarnings || 0;

    // TODO: Calculate rating when rating system is implemented
    const rating = 0;

    return {
      totalRides,
      earnings,
      rating,
    };
  }
}

