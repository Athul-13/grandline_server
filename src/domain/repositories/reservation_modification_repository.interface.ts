import { ReservationModification } from '../entities/reservation_modification.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for ReservationModification entity operations
 * Defines the contract for data access layer implementations
 */
export interface IReservationModificationRepository extends IBaseRepository<ReservationModification> {
  /**
   * Finds all modifications for a reservation, ordered by creation date (newest first)
   */
  findByReservationId(reservationId: string): Promise<ReservationModification[]>;

  /**
   * Finds modifications by modification type
   */
  findByReservationIdAndType(
    reservationId: string,
    modificationType: ReservationModification['modificationType']
  ): Promise<ReservationModification[]>;
}

