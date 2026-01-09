import { vi } from 'vitest';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { Quote } from '../../../../domain/entities/quote.entity';
import { QuoteStatus, TripType } from '../../../../shared/constants';
import {
  GeographicData,
  QuoteConversionRates,
  RevenueMetrics,
  TimeTrend,
  UserAnalytics,
  VehicleAnalytics,
} from '../../../../application/dtos/dashboard.dto';

/**
 * Mock implementation of IQuoteRepository
 * Use this in unit tests to avoid database dependencies
 */
export class MockQuoteRepository implements IQuoteRepository {
  findById = vi.fn<[string], Promise<Quote | null>>().mockResolvedValue(null);
  create = vi.fn<[Quote], Promise<void>>().mockResolvedValue(undefined);
  updateById = vi.fn<[string, Partial<Quote>], Promise<void>>().mockResolvedValue(undefined);
  deleteById = vi.fn<[string], Promise<void>>().mockResolvedValue(undefined);
  findByUserId = vi.fn<[string], Promise<Quote[]>>().mockResolvedValue([]);
  findByStatus = vi.fn<[QuoteStatus], Promise<Quote[]>>().mockResolvedValue([]);
  findByUserIdAndStatus = vi.fn<[string, QuoteStatus], Promise<Quote[]>>().mockResolvedValue([]);
  findActiveQuotesByUserId = vi.fn<[string], Promise<Quote[]>>().mockResolvedValue([]);
  findAllQuotesByUserId = vi.fn<[string], Promise<Quote[]>>().mockResolvedValue([]);
  softDelete = vi.fn<[string], Promise<void>>().mockResolvedValue(undefined);
  findByTripType = vi.fn<[TripType], Promise<Quote[]>>().mockResolvedValue([]);
  findByQuoteNumber = vi.fn<[string], Promise<Quote[] | null>>().mockResolvedValue(null);
  findAllForAdmin = vi.fn<
    [boolean, QuoteStatus[]?, string[]?, boolean?, string?],
    Promise<Quote[]>
  >().mockResolvedValue([]);
  findBookedVehicleIdsInDateRange = vi.fn<
    [Date, Date, string?],
    Promise<Set<string>>
  >().mockResolvedValue(new Set<string>());
  findBookedDriverIdsInDateRange = vi.fn<
    [Date, Date, string?],
    Promise<Set<string>>
  >().mockResolvedValue(new Set<string>());
  findReservedVehicleIdsInDateRange = vi.fn<
    [Date, Date, string?],
    Promise<Set<string>>
  >().mockResolvedValue(new Set<string>());
  getCountsByStatus = vi.fn<[], Promise<Map<QuoteStatus, number>>>().mockResolvedValue(new Map());
  getRevenueMetrics = vi.fn().mockResolvedValue({
    totalRevenue: 0,
    averageValue: 0,
    minValue: 0,
    maxValue: 0,
  } satisfies RevenueMetrics);
  getConversionRates = vi
    .fn()
    .mockResolvedValue({
      draftToSubmitted: 0,
      submittedToQuoted: 0,
      quotedToPaid: 0,
      overallConversion: 0,
    } satisfies QuoteConversionRates);
  getTimeBasedTrends = vi
    .fn()
    .mockResolvedValue([] as TimeTrend[]);
  getGeographicAnalytics = vi.fn().mockResolvedValue([] as GeographicData[]);
  getVehicleAnalytics = vi.fn().mockResolvedValue([] as VehicleAnalytics[]);
  getUserAnalytics = vi.fn().mockResolvedValue([] as UserAnalytics[]);
}

