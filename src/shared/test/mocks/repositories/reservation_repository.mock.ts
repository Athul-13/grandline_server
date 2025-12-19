import { vi } from 'vitest';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { ReservationStatus } from '../../../../shared/constants';
import {
  GeographicData,
  RefundAnalytics,
  ReservationConversionRates,
  RevenueMetrics,
  UserAnalytics,
  VehicleAnalytics,
} from '../../../../application/dtos/dashboard.dto';

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
  findByPaymentId = vi.fn<[string], Promise<Reservation | null>>().mockResolvedValue(null);
  findByUserId = vi
    .fn<[string, number, number], Promise<{ reservations: Reservation[]; total: number }>>()
    .mockResolvedValue({ reservations: [], total: 0 });
  findByStatus = vi.fn<[ReservationStatus], Promise<Reservation[]>>().mockResolvedValue([]);
  findByUserIdAndStatus = vi.fn<[string, ReservationStatus], Promise<Reservation[]>>().mockResolvedValue([]);
  findByAssignedDriverId = vi.fn<[string], Promise<Reservation[]>>().mockResolvedValue([]);
  findAllForAdmin = vi
    .fn<
      [number, number, boolean | undefined, ReservationStatus[] | undefined, string[] | undefined, string | undefined],
      Promise<{ reservations: Reservation[]; total: number }>
    >()
    .mockResolvedValue({ reservations: [], total: 0 });
  findAll = vi.fn<[], Promise<Reservation[]>>().mockResolvedValue([]);
  findBookedDriverIdsInDateRange = vi
    .fn<[Date, Date, string | undefined], Promise<Set<string>>>()
    .mockResolvedValue(new Set<string>());
  getCountsByStatus = vi.fn<[], Promise<Map<ReservationStatus, number>>>().mockResolvedValue(new Map());
  getRevenueMetrics = vi.fn().mockResolvedValue({
    totalRevenue: 0,
    averageValue: 0,
    minValue: 0,
    maxValue: 0,
  } satisfies RevenueMetrics);
  getConversionRates = vi
    .fn()
    .mockResolvedValue({
      quoteToReservation: 0,
      confirmedToCompleted: 0,
      cancellationRate: 0,
    } satisfies ReservationConversionRates);
  getTimeBasedTrends = vi
    .fn()
    .mockResolvedValue([]);
  getGeographicAnalytics = vi.fn().mockResolvedValue([] as GeographicData[]);
  getVehicleAnalytics = vi.fn().mockResolvedValue([] as VehicleAnalytics[]);
  getUserAnalytics = vi.fn().mockResolvedValue([] as UserAnalytics[]);
  getRefundAnalytics = vi.fn().mockResolvedValue({
    totalRefunded: 0,
    refundRate: 0,
    averageRefundAmount: 0,
    refundsByStatus: {},
  } satisfies RefundAnalytics);
}

