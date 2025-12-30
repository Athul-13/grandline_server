import { vi } from 'vitest';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { Quote } from '../../../../domain/entities/quote.entity';
import { QuoteStatus, TripType } from '../../../../shared/constants';

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
}

