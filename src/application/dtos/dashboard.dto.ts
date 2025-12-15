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

/**
 * Date range for analytics queries
 */
export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Request DTO for admin dashboard analytics
 */
export interface AdminDashboardAnalyticsRequest {
  timeRange?: 'all_time' | '7_days' | '30_days' | 'custom';
  startDate?: string;
  endDate?: string;
}

/**
 * Revenue metrics structure
 */
export interface RevenueMetrics {
  totalRevenue: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
}

/**
 * Conversion rates structure for quotes
 */
export interface QuoteConversionRates {
  draftToSubmitted: number;
  submittedToQuoted: number;
  quotedToPaid: number;
  overallConversion: number;
}

/**
 * Conversion rates structure for reservations
 */
export interface ReservationConversionRates {
  quoteToReservation: number;
  confirmedToCompleted: number;
  cancellationRate: number;
}

/**
 * Time trend data point
 */
export interface TimeTrend {
  date: string;
  count: number;
  revenue: number;
}

/**
 * Geographic data point
 */
export interface GeographicData {
  location: string;
  count: number;
  revenue?: number;
}

/**
 * Vehicle analytics data point
 */
export interface VehicleAnalytics {
  vehicleId: string;
  vehicleName?: string;
  count: number;
  revenue: number;
  utilization?: number;
}

/**
 * User analytics data point
 */
export interface UserAnalytics {
  userId: string;
  userName?: string;
  quoteCount?: number;
  reservationCount?: number;
  totalRevenue: number;
}

/**
 * Refund analytics structure
 */
export interface RefundAnalytics {
  totalRefunded: number;
  refundRate: number;
  refundsByStatus: { [status: string]: number };
  averageRefundAmount: number;
}

/**
 * Quotes analytics structure
 */
export interface QuoteAnalytics {
  countsByStatus: { [status: string]: number };
  totalCount: number;
  revenueMetrics: RevenueMetrics;
  conversionRates: QuoteConversionRates;
  timeBasedTrends: TimeTrend[];
  geographicData: GeographicData[];
  vehicleAnalytics: VehicleAnalytics[];
  userAnalytics: {
    topCustomers: UserAnalytics[];
    repeatCustomers: number;
    newCustomers: number;
  };
}

/**
 * Reservations analytics structure
 */
export interface ReservationAnalytics {
  countsByStatus: { [status: string]: number };
  totalCount: number;
  revenueMetrics: RevenueMetrics;
  conversionRates: ReservationConversionRates;
  timeBasedTrends: TimeTrend[];
  geographicData: GeographicData[];
  vehicleAnalytics: VehicleAnalytics[];
  userAnalytics: {
    topCustomers: UserAnalytics[];
    repeatCustomers: number;
  };
  refundAnalytics: RefundAnalytics;
}

/**
 * Overall metrics combining quotes and reservations insights
 */
export interface OverallMetrics {
  totalQuotes: number;
  totalReservations: number;
  totalRevenue: number;
  quoteToReservationConversionRate: number;
  averageQuoteValue: number;
  averageReservationValue: number;
}

/**
 * Response DTO for admin dashboard analytics
 */
export interface AdminDashboardAnalyticsResponse {
  quotesAnalytics: QuoteAnalytics;
  reservationsAnalytics: ReservationAnalytics;
  overallMetrics: OverallMetrics;
}

