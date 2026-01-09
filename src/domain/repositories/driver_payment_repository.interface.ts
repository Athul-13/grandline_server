import { DriverPayment } from "../entities/driver_payment.entity";
import { IBaseRepository } from "./base_repository.interface";

export interface IDriverPaymentRepository extends IBaseRepository<DriverPayment> {
    /**
     * Create a new driver payment
     */
    createDriverPayment(driverPayment: DriverPayment): Promise<void>;
 
    /**
     * Find driver payments by driver ID
     */
    findDriverPaymentsByDriverId(driverId: string): Promise<DriverPayment[]>;

    /**
     * Find driver payments by reservation ID
     */
    findDriverPaymentsByReservationId(reservationId: string): Promise<DriverPayment[]>;

}