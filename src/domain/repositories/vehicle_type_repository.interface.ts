import { VehicleType } from "../entities/vehicle_type.entity";
import { IBaseRepository } from "./base_repository.interface";

/**
 * Repository interface for VehicleType entity operations
 * Defines the contract for data access layer implementations
 */
export interface IVehicleTypeRepository extends IBaseRepository<VehicleType> {
  /**
   * Finds a vehicle type by name
   */
  findByName(name: string): Promise<VehicleType | null>;

  /**
   * Finds all vehicle types
   */
  findAll(): Promise<VehicleType[]>;
}