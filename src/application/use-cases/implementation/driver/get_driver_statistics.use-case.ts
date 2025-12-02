import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { GetDriverStatisticsRequest, GetDriverStatisticsResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';
import { IGetDriverStatisticsUseCase } from '../../interface/driver/get_driver_statistics_use_case.interface';

/**
 * Use case for getting driver statistics (admin)
 * Returns aggregated statistics about drivers
 */
@injectable()
export class GetDriverStatisticsUseCase implements IGetDriverStatisticsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(request: GetDriverStatisticsRequest): Promise<GetDriverStatisticsResponse> {
    // Calculate time range dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const now = new Date();
    const timeRangeType = request.timeRange || 'all_time';

    switch (timeRangeType) {
      case '7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'custom':
        if (request.startDate) {
          startDate = new Date(request.startDate);
        }
        if (request.endDate) {
          endDate = new Date(request.endDate);
        }
        break;
      case 'all_time':
      default:
        // No date filtering for all_time
        break;
    }

    // Get statistics from repository
    const statistics = await this.driverRepository.getDriverStatistics(
      startDate || endDate ? { startDate, endDate } : undefined
    );

    logger.info(
      `Driver statistics fetched: total=${statistics.totalDrivers}, onboarded=${statistics.onboardedDrivers}, timeRange=${timeRangeType}`
    );

    return {
      statistics: {
        ...statistics,
        timeRange: {
          type: timeRangeType,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        },
      },
    };
  }
}

