import { DashboardStatsResponse } from '../../../dtos/dashboard.dto';

/**
 * Interface for getting dashboard statistics use case
 */
export interface IGetDashboardStatsUseCase {
  execute(driverId: string): Promise<DashboardStatsResponse>;
}

