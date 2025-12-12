import { vi } from 'vitest';
import { IReservationModificationRepository } from '../../../../domain/repositories/reservation_modification_repository.interface';
import { ReservationModification } from '../../../../domain/entities/reservation_modification.entity';

/**
 * Mock implementation of IReservationModificationRepository
 * Use this in unit tests to avoid database dependencies
 */
export class MockReservationModificationRepository implements IReservationModificationRepository {
  findById = vi.fn<[string], Promise<ReservationModification | null>>().mockResolvedValue(null);
  create = vi.fn<[ReservationModification], Promise<void>>().mockResolvedValue(undefined);
  findByReservationId = vi
    .fn<[string], Promise<ReservationModification[]>>()
    .mockResolvedValue([]);
  findAll = vi.fn<[], Promise<ReservationModification[]>>().mockResolvedValue([]);
}

