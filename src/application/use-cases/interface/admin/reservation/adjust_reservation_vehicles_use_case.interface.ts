import { Reservation } from '../../../../../domain/entities/reservation.entity';

/**
 * Vehicle adjustment data
 */
export interface VehicleAdjustmentData {
  vehicleId: string;
  quantity: number;
}

/**
 * Interface for adjusting reservation vehicles use case
 */
export interface IAdjustReservationVehiclesUseCase {
  execute(
    reservationId: string,
    vehicles: VehicleAdjustmentData[],
    adminUserId: string
  ): Promise<Reservation>;
}

