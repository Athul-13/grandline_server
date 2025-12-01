import { injectable, inject } from 'tsyringe';
import { IGetUserStatisticsUseCase } from '../../interface/user/get_user_statistics_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { GetUserStatisticsRequest, GetUserStatisticsResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting user statistics (admin)
 * Provides comprehensive analytics for user management
 * Excludes admin users from statistics
 */
@injectable()
export class GetUserStatisticsUseCase implements IGetUserStatisticsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetUserStatisticsRequest): Promise<GetUserStatisticsResponse> {
    // Calculate time range
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let timeRangeType: 'all_time' | '7_days' | '30_days' | 'custom' = 'all_time';

    if (request.timeRange) {
      timeRangeType = request.timeRange;
      const now = new Date();

      switch (request.timeRange) {
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
          // No date filtering
          break;
      }
    }

    // Get statistics from repository
    const statistics = await this.userRepository.getUserStatistics(
      startDate || endDate ? { startDate, endDate } : undefined
    );

    logger.info(`User statistics retrieved: ${timeRangeType} range`);

    return {
      statistics: {
        ...statistics,
        timeRange: {
          type: timeRangeType,
          startDate,
          endDate,
        },
      },
    };
  }
}

