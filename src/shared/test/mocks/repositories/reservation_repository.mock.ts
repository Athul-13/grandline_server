import { vi } from 'vitest';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { ReservationStatus } from '../../../../shared/constants';

/**
 * Mock implementation of IReservationRepository
 * Use this in unit tests to avoid database dependencies
 */
export class MockReservationRepository implements IReservationRepository {
  findById = vi.fn<[string], Promise<Reservation | null>>().mockResolvedValue(null);
  create = vi.fn<[Reservation], Promise<void>>().mockResolvedValue(undefined);
  updateById = vi.fn<[string, Partial<Reservation>], Promise<void>>().mockResolvedValue(undefined);
  deleteById = vi.fn<[string], Promise<void>>().mockResolvedValue(undefined);
  findByQuoteId = vi.fn<[string], Promise<Reservation | null>>().mockResolvedValue(null);
  findByUserId = vi.fn<[string], Promise<Reservation[]>>().mockResolvedValue([]);
  findByStatus = vi.fn<[ReservationStatus], Promise<Reservation[]>>().mockResolvedValue([]);
  findAll = vi.fn<[], Promise<Reservation[]>>().mockResolvedValue([]);
  findBookedDriverIdsInDateRange = vi
    .fn<[Date, Date], Promise<string[]>>()
    .mockResolvedValue([]);
}

