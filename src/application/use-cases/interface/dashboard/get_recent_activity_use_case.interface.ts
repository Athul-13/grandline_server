import { RecentActivityResponse } from '../../../dtos/dashboard.dto';

/**
 * Interface for getting recent activity use case
 */
export interface IGetRecentActivityUseCase {
  execute(driverId: string): Promise<RecentActivityResponse[]>;
}

