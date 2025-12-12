import { ReservationCharge } from '../entities/reservation_charge.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for ReservationCharge entity operations
 * Defines the contract for data access layer implementations
 */
export interface IReservationChargeRepository extends IBaseRepository<ReservationCharge> {
  /**
   * Finds all charges for a reservation
   */
  findByReservationId(reservationId: string): Promise<ReservationCharge[]>;

  /**
   * Finds unpaid charges for a reservation
   */
  findUnpaidByReservationId(reservationId: string): Promise<ReservationCharge[]>;

  /**
   * Finds charges by charge type
   */
  findByReservationIdAndType(
    reservationId: string,
    chargeType: ReservationCharge['chargeType']
  ): Promise<ReservationCharge[]>;
}

