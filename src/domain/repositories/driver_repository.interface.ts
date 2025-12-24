import { Driver } from "../entities/driver.entity";
import { IBaseRepository } from "./base_repository.interface";
import { DriverStatus } from "../../shared/constants";

/**
 * Repository interface for Driver entity operations
 * Defines the contract for data access layer implementations
 * 
 */
export interface IDriverRepository extends IBaseRepository<Driver> {
    /**
     * Create a new driver with password hash
     */
    createDriver(driver: Driver, passwordHash: string): Promise<void>;

    /**
     * Find driver by email
     */
    findByEmail(email: string): Promise<Driver | null>;

    /**
     * Find driver by ID
     */
    findById(driverId: string): Promise<Driver | null>;

    /**
     * Get password hash for a driver
     */
    getPasswordHash(driverId: string): Promise<string>;

    /**
     * Update driver password
     */
    updatePassword(driverId: string, passwordHash: string): Promise<void>;

    /**
     * Update driver profile information
     */
    updateDriverProfile(
        driverId: string,
        updates: {
            fullName?: string;
            email?: string;
            phoneNumber?: string;
            licenseNumber?: string;
            profilePictureUrl?: string;
            licenseCardPhotoUrl?: string;
            salary?: number;
        }
    ): Promise<Driver>;

    /**
     * Update driver status
     */
    updateDriverStatus(driverId: string, status: DriverStatus): Promise<Driver>;

    /**
     * Update driver salary
     */
    updateSalary(driverId: string, salary: number): Promise<Driver>;

    /**
     * Find drivers with filters, pagination, and search
     */
    findDriversWithFilters(filters: {
        status?: DriverStatus[];
        isOnboarded?: boolean;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    }): Promise<{ drivers: Driver[]; total: number }>;

    /**
     * Get driver statistics
     */
    getDriverStatistics(timeRange?: { startDate?: Date; endDate?: Date }): Promise<{
        totalDrivers: number;
        availableDrivers: number;
        offlineDrivers: number;
        onTripDrivers: number;
        suspendedDrivers: number;
        blockedDrivers: number;
        onboardedDrivers: number;
        notOnboardedDrivers: number;
        newDrivers: number;
        driversByStatus: Record<string, number>;
    }>;

    /**
     * Soft delete a driver
     */
    softDelete(driverId: string): Promise<void>;

    /**
     * Find available drivers (for trip assignment)
     */
    findAvailableDrivers(): Promise<Driver[]>;

    /**
     * Update driver's last assigned timestamp (for fair assignment)
     */
    updateLastAssignedAt(driverId: string, lastAssignedAt: Date): Promise<void>;
}