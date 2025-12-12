/**
 * Response DTO for dashboard statistics
 */
export interface DashboardStatsResponse {
  totalRides: number;
  earnings: number;
  rating: number;
}

/**
 * Response DTO for recent activity
 */
export interface RecentActivityResponse {
  id: string;
  type: string;
  date: string;
  amount?: number;
}

