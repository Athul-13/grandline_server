import { Driver } from "../entities/driver.entity";
import { IBaseRepository } from "./base_repository.interface";

/**
 * Repository interface for Driver entity operations
 * Defines the contract for data access layer implementations
 * 
 */
export interface IDriverRepository extends IBaseRepository<Driver> {
    findByEmail(email: string): Promise<Driver | null>;
    
    findAvailableDrivers(): Promise<Driver[]>;
}