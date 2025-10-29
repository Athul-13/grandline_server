import { Driver } from "../entities/driver.entity";

/**
 * Repository interface for Driver entity operations
 * Defines the contract for data access layer implementations
 * 
 */
export interface IDriverRepository {
    findByEmail(email: string): Promise<Driver | null>;

    findById(driverId: string): Promise<Driver | null>;
    
    findAvailableDrivers(): Promise<Driver[]>;
    
    save(driver: Driver): Promise<void>;
}