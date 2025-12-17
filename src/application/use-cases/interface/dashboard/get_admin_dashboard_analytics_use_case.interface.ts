import { AdminDashboardAnalyticsRequest, AdminDashboardAnalyticsResponse } from '../../../dtos/dashboard.dto';

/**
 * Interface for getting admin dashboard analytics use case
 */
export interface IGetAdminDashboardAnalyticsUseCase {
  /**
   * Executes the use case to get comprehensive analytics for admin dashboard
   * @param request - Request parameters including time range filters
   * @returns Admin dashboard analytics response
   */
  execute(request?: AdminDashboardAnalyticsRequest): Promise<AdminDashboardAnalyticsResponse>;
}

