import { injectable, container } from 'tsyringe';
import { IDriverRepository } from '../../domain/repositories/driver_repository.interface';
import { Driver } from '../../domain/entities/driver.entity';
import { IDriverModel, createDriverModel } from '../database/mongodb/models/driver.model';
import { DriverRepositoryMapper } from '../mappers/driver_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { DriverStatus } from '../../shared/constants';
import { IQueueService } from '../../domain/services/queue_service.interface';
import { SERVICE_TOKENS } from '../../application/di/tokens';
import { logger } from '../../shared/logger';

/**
 * Driver repository implementation
 * Handles data persistence operations for Driver entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class DriverRepositoryImpl
  extends MongoBaseRepository<IDriverModel, Driver>
  implements IDriverRepository {

  private readonly driverModel: IDatabaseModel<IDriverModel>;

  constructor() {
    // Create model instance using factory
    const model = createDriverModel();
    super(model, 'driverId');
    this.driverModel = model;
  }

  protected toEntity(doc: IDriverModel): Driver {
    return DriverRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Driver): Partial<IDriverModel> {
    return {
      driverId: entity.driverId,
      fullName: entity.fullName,
      email: entity.email,
      phoneNumber: entity.phoneNumber,
      profilePictureUrl: entity.profilePictureUrl,
      licenseNumber: entity.licenseNumber,
      licenseCardPhotoUrl: entity.licenseCardPhotoUrl,
      status: entity.status,
      salary: entity.salary,
      isOnboarded: entity.isOnboarded,
    };
  }

  async createDriver(driver: Driver, passwordHash: string): Promise<void> {
    await this.driverModel.create({
      driverId: driver.driverId,
      fullName: driver.fullName,
      email: driver.email,
      password: passwordHash,
      phoneNumber: driver.phoneNumber,
      profilePictureUrl: driver.profilePictureUrl,
      licenseNumber: driver.licenseNumber,
      licenseCardPhotoUrl: driver.licenseCardPhotoUrl,
      status: driver.status,
      salary: driver.salary,
      isOnboarded: driver.isOnboarded,
    });
  }

  async findByEmail(email: string): Promise<Driver | null> {
    const doc = await this.driverModel.findOne({ email, isDeleted: { $ne: true } }, { select: '+password' });
    return doc ? this.toEntity(doc) : null;
  }

  async findById(driverId: string): Promise<Driver | null> {
    const doc = await this.driverModel.findOne({ driverId, isDeleted: { $ne: true } }, { select: '+password' });
    return doc ? this.toEntity(doc) : null;
  }

  async getPasswordHash(driverId: string): Promise<string> {
    const doc = await this.driverModel.findOne({ driverId }, { select: '+password' });

    if (!doc || !doc.password) {
      throw new Error(`Password hash not found for driver ${driverId}`);
    }

    return doc.password;
  }

  async updatePassword(driverId: string, passwordHash: string): Promise<void> {
    const result = await this.driverModel.updateOne(
      { driverId },
      { $set: { password: passwordHash } }
    );

    if (result.matchedCount === 0) {
      throw new Error(`Driver with id ${driverId} not found`);
    }
  }

  async updateDriverProfile(
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
  ): Promise<Driver> {
    const updateData: Partial<IDriverModel> = {};
    
    if (updates.fullName !== undefined) {
      updateData.fullName = updates.fullName;
    }
    if (updates.email !== undefined) {
      updateData.email = updates.email;
    }
    if (updates.phoneNumber !== undefined) {
      updateData.phoneNumber = updates.phoneNumber;
    }
    if (updates.licenseNumber !== undefined) {
      updateData.licenseNumber = updates.licenseNumber;
    }
    if (updates.profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = updates.profilePictureUrl;
    }
    if (updates.licenseCardPhotoUrl !== undefined) {
      updateData.licenseCardPhotoUrl = updates.licenseCardPhotoUrl;
    }
    if (updates.salary !== undefined) {
      updateData.salary = updates.salary;
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Check if both photos are uploaded, then auto-set isOnboarded
    const currentDriver = await this.driverModel.findOne({ driverId });
    if (currentDriver) {
      const profilePictureUrl = updates.profilePictureUrl !== undefined 
        ? updates.profilePictureUrl 
        : currentDriver.profilePictureUrl;
      const licenseCardPhotoUrl = updates.licenseCardPhotoUrl !== undefined 
        ? updates.licenseCardPhotoUrl 
        : currentDriver.licenseCardPhotoUrl;
      
      const wasOnboarded = currentDriver.isOnboarded;
      if (profilePictureUrl !== '' && licenseCardPhotoUrl !== '' && !currentDriver.isOnboarded) {
        updateData.isOnboarded = true;
      }

      // Trigger job to process pending quotes when driver completes onboarding
      if (!wasOnboarded && updateData.isOnboarded === true) {
        // Use container.resolve to avoid circular dependency issues
        // This is called asynchronously to not block the repository update
        setImmediate(() => {
          void (async () => {
            try {
              const queueService = container.resolve<IQueueService>(SERVICE_TOKENS.IQueueService);
              await queueService.addProcessPendingQuotesJob();
              logger.info(`Driver ${driverId} completed onboarding, triggered pending quotes job`);
            } catch (error) {
              // Don't fail repository update if queue service fails
              logger.warn(
                `Failed to trigger pending quotes job after driver ${driverId} onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          })();
        });
      }
    }

    const result = await this.driverModel.updateOne(
      { driverId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error(`Driver with id ${driverId} not found`);
    }

    const updatedDoc = await this.driverModel.findOne({ driverId });
    if (!updatedDoc) {
      throw new Error(`Driver with id ${driverId} not found after update`);
    }

    return this.toEntity(updatedDoc);
  }

  async updateDriverStatus(driverId: string, status: DriverStatus): Promise<Driver> {
    const result = await this.driverModel.updateOne(
      { driverId },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error(`Driver with id ${driverId} not found`);
    }

    const updatedDoc = await this.driverModel.findOne({ driverId });
    if (!updatedDoc) {
      throw new Error(`Driver with id ${driverId} not found after update`);
    }

    return this.toEntity(updatedDoc);
  }

  async updateSalary(driverId: string, salary: number): Promise<Driver> {
    const result = await this.driverModel.updateOne(
      { driverId },
      { $set: { salary, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error(`Driver with id ${driverId} not found`);
    }

    const updatedDoc = await this.driverModel.findOne({ driverId });
    if (!updatedDoc) {
      throw new Error(`Driver with id ${driverId} not found after update`);
    }

    return this.toEntity(updatedDoc);
  }

  async findDriversWithFilters(filters: {
    status?: DriverStatus[];
    isOnboarded?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ drivers: Driver[]; total: number }> {
    // Build MongoDB filter - exclude soft-deleted drivers
    const filter: Record<string, unknown> = {
      isDeleted: { $ne: true }, // Exclude soft-deleted drivers (includes missing field for existing drivers)
    };

    // Add status filter
    if (filters.status && filters.status.length > 0) {
      filter.status = { $in: filters.status };
    }

    // Add onboarding filter
    if (filters.isOnboarded !== undefined) {
      filter.isOnboarded = filters.isOnboarded;
    }

    // Add search filter (case-insensitive search across email, fullName, phoneNumber, licenseNumber)
    if (filters.search && filters.search.trim().length > 0) {
      const searchRegex = { $regex: filters.search.trim(), $options: 'i' };
      filter.$or = [
        { email: searchRegex },
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
        { licenseNumber: searchRegex },
      ];
    }

    // Fetch all matching drivers (we'll paginate in memory for now)
    const allDocs = await this.driverModel.find(filter);
    const allDrivers = DriverRepositoryMapper.toEntities(allDocs);

    // Apply sorting
    let sortedDrivers = allDrivers;
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
      sortedDrivers = [...allDrivers].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (filters.sortBy) {
          case 'email':
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
            break;
          case 'fullName':
            aValue = a.fullName.toLowerCase();
            bValue = b.fullName.toLowerCase();
            break;
          case 'licenseNumber':
            aValue = a.licenseNumber.toLowerCase();
            bValue = b.licenseNumber.toLowerCase();
            break;
          case 'createdAt':
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          default:
            // Default to createdAt
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
        }

        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });
    } else {
      // Default sort: newest first (createdAt desc)
      sortedDrivers = [...allDrivers].sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    const total = sortedDrivers.length;

    // Apply pagination
    if (filters.page && filters.limit) {
      const normalizedPage = Math.max(1, Math.floor(filters.page) || 1);
      const normalizedLimit = Math.max(1, Math.min(100, Math.floor(filters.limit) || 20));
      const startIndex = (normalizedPage - 1) * normalizedLimit;
      const endIndex = startIndex + normalizedLimit;
      sortedDrivers = sortedDrivers.slice(startIndex, endIndex);
    }

    return {
      drivers: sortedDrivers,
      total,
    };
  }

  async getDriverStatistics(timeRange?: { startDate?: Date; endDate?: Date }): Promise<{
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
  }> {
    // Base filter: exclude soft-deleted drivers
    const baseFilter: Record<string, unknown> = {
      isDeleted: { $ne: true }, // Exclude soft-deleted drivers (includes missing field for existing drivers)
    };

    // Add time range filter for new drivers if provided
    const newDriversFilter: Record<string, unknown> = { ...baseFilter };
    if (timeRange?.startDate || timeRange?.endDate) {
      newDriversFilter.createdAt = {};
      if (timeRange.startDate) {
        newDriversFilter.createdAt = { ...newDriversFilter.createdAt as Record<string, unknown>, $gte: timeRange.startDate };
      }
      if (timeRange.endDate) {
        newDriversFilter.createdAt = { ...newDriversFilter.createdAt as Record<string, unknown>, $lte: timeRange.endDate };
      }
    }

    // Get all drivers
    const allDrivers = await this.driverModel.find(baseFilter);
    
    // Calculate statistics
    const totalDrivers = allDrivers.length;
    const availableDrivers = allDrivers.filter(d => d.status === DriverStatus.AVAILABLE).length;
    const offlineDrivers = allDrivers.filter(d => d.status === DriverStatus.OFFLINE).length;
    const onTripDrivers = allDrivers.filter(d => d.status === DriverStatus.ON_TRIP).length;
    const suspendedDrivers = allDrivers.filter(d => d.status === DriverStatus.SUSPENDED).length;
    const blockedDrivers = allDrivers.filter(d => d.status === DriverStatus.BLOCKED).length;
    const onboardedDrivers = allDrivers.filter(d => d.isOnboarded === true).length;
    const notOnboardedDrivers = allDrivers.filter(d => d.isOnboarded === false).length;
    
    // Get new drivers in time range
    const newDriversDocs = timeRange ? await this.driverModel.find(newDriversFilter) : allDrivers;
    const newDrivers = newDriversDocs.length;

    // Drivers by status breakdown
    const driversByStatus: Record<string, number> = {
      [DriverStatus.AVAILABLE]: availableDrivers,
      [DriverStatus.OFFLINE]: offlineDrivers,
      [DriverStatus.ON_TRIP]: onTripDrivers,
      [DriverStatus.SUSPENDED]: suspendedDrivers,
      [DriverStatus.BLOCKED]: blockedDrivers,
    };

    return {
      totalDrivers,
      availableDrivers,
      offlineDrivers,
      onTripDrivers,
      suspendedDrivers,
      blockedDrivers,
      onboardedDrivers,
      notOnboardedDrivers,
      newDrivers,
      driversByStatus,
    };
  }

  async softDelete(driverId: string): Promise<void> {
    const result = await this.driverModel.updateOne(
      { driverId },
      { $set: { isDeleted: true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error(`Driver with id ${driverId} not found`);
    }
  }

  async findAvailableDrivers(): Promise<Driver[]> {
    const docs = await this.driverModel.find({
      status: DriverStatus.AVAILABLE,
      isOnboarded: true,
      isDeleted: { $ne: true },
    }).sort({ lastAssignedAt: 1 }); // Sort by least recently assigned (nulls first = highest priority)
    return DriverRepositoryMapper.toEntities(docs);
  }

  async updateLastAssignedAt(driverId: string, lastAssignedAt: Date): Promise<void> {
    const result = await this.driverModel.updateOne(
      { driverId },
      { $set: { lastAssignedAt, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error(`Driver with id ${driverId} not found`);
    }
  }
}

