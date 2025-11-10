import { VehicleStatus } from "../../shared/constants";
import { Vehicle } from "../entities/vehicle.entity";
import { IBaseRepository } from "./base_repository.interface";

/**
 * Repository interface for Vehicle entity operations
 * Defines the contract for data access layer implementations
 */
export interface IVehicleRepository extends IBaseRepository<Vehicle> {
  /**
   * Finds vehicles by vehicle type ID
   */
  findByVehicleTypeId(vehicleTypeId: string): Promise<Vehicle[]>;

  /**
   * Finds a vehicle by plate number
   */
  findByPlateNumber(plateNumber: string): Promise<Vehicle | null>;

  /**
   * Finds all available vehicles
   */
  findAvailableVehicles(): Promise<Vehicle[]>;

  /**
   * Finds vehicles by status
   */
  findByStatus(status: VehicleStatus): Promise<Vehicle[]>;

  /**
   * Finds all vehicles
   */
  findAll(): Promise<Vehicle[]>;

  /**
   * Gets the minimum and maximum year from all vehicles
   * Returns default values if no vehicles exist
   */
  getMinMaxYear(): Promise<{ min: number; max: number }>;

  /**
   * Gets the minimum and maximum capacity from all vehicles
   * Returns default values if no vehicles exist
   */
  getMinMaxCapacity(): Promise<{ min: number; max: number }>;
}