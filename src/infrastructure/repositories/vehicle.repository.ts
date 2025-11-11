import { injectable } from 'tsyringe';
import { IVehicleRepository } from '../../domain/repositories/vehicle_repository.interface';
import { VehicleFilter } from '../../domain/repositories/vehicle_filter.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { IVehicleModel, createVehicleModel } from '../database/mongodb/models/vehicle.model';
import { VehicleRepositoryMapper } from '../mappers/vehicle_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { VehicleStatus } from '../../shared/constants';

/**
 * Vehicle repository implementation
 * Handles data persistence operations for Vehicle entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class VehicleRepositoryImpl
  extends MongoBaseRepository<IVehicleModel, Vehicle>
  implements IVehicleRepository {

  private readonly vehicleModel: IDatabaseModel<IVehicleModel>;

  constructor() {
    // Create model instance using factory
    const model = createVehicleModel();
    super(model, 'vehicleId');
    this.vehicleModel = model;
  }

  protected toEntity(doc: IVehicleModel): Vehicle {
    return VehicleRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Vehicle): Partial<IVehicleModel> {
    return {
      vehicleId: entity.vehicleId,
      vehicleTypeId: entity.vehicleTypeId,
      capacity: entity.capacity,
      baseFare: entity.baseFare,
      maintenance: entity.maintenance,
      plateNumber: entity.plateNumber,
      vehicleModel: entity.vehicleModel,
      year: entity.year,
      fuelConsumption: entity.fuelConsumption,
      imageUrls: entity.imageUrls,
      status: entity.status,
      amenityIds: entity.amenityIds && entity.amenityIds.length > 0 ? entity.amenityIds : [],
    };
  }

  async findByVehicleTypeId(vehicleTypeId: string): Promise<Vehicle[]> {
    const docs = await this.vehicleModel.find({ vehicleTypeId });
    return VehicleRepositoryMapper.toEntities(docs);
  }

  async findByPlateNumber(plateNumber: string): Promise<Vehicle | null> {
    const doc = await this.vehicleModel.findOne({ plateNumber: plateNumber.toUpperCase() });
    return doc ? this.toEntity(doc) : null;
  }

  async findAvailableVehicles(): Promise<Vehicle[]> {
    const docs = await this.vehicleModel.find({ status: VehicleStatus.AVAILABLE });
    return VehicleRepositoryMapper.toEntities(docs);
  }

  async findByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    const docs = await this.vehicleModel.find({ status });
    return VehicleRepositoryMapper.toEntities(docs);
  }

  async findAll(): Promise<Vehicle[]> {
    const docs = await this.vehicleModel.find({});
    return VehicleRepositoryMapper.toEntities(docs);
  }

  async getMinMaxYear(): Promise<{ min: number; max: number }> {
    const pipeline = [
      {
        $group: {
          _id: null,
          minYear: { $min: '$year' },
          maxYear: { $max: '$year' },
        },
      },
    ];

    const result = await this.vehicleModel.aggregate(pipeline);

    // Handle empty result (no vehicles in database)
    if (!result || result.length === 0) {
      const currentYear = new Date().getFullYear();
      return { min: 1900, max: currentYear };
    }

    const firstResult = result[0] as { minYear?: number | null; maxYear?: number | null };
    
    if (firstResult.minYear === null || firstResult.minYear === undefined || 
        firstResult.maxYear === null || firstResult.maxYear === undefined) {
      const currentYear = new Date().getFullYear();
      return { min: 1900, max: currentYear };
    }

    return {
      min: firstResult.minYear,
      max: firstResult.maxYear,
    };
  }

  async getMinMaxCapacity(): Promise<{ min: number; max: number }> {
    const pipeline = [
      {
        $group: {
          _id: null,
          minCapacity: { $min: '$capacity' },
          maxCapacity: { $max: '$capacity' },
        },
      },
    ];

    const result = await this.vehicleModel.aggregate(pipeline);

    // Handle empty result (no vehicles in database)
    if (!result || result.length === 0) {
      return { min: 1, max: 50 };
    }

    const firstResult = result[0] as { minCapacity?: number | null; maxCapacity?: number | null };
    
    if (firstResult.minCapacity === null || firstResult.minCapacity === undefined || 
        firstResult.maxCapacity === null || firstResult.maxCapacity === undefined) {
      return { min: 1, max: 50 };
    }

    return {
      min: firstResult.minCapacity,
      max: firstResult.maxCapacity,
    };
  }

  async findByAmenityId(amenityId: string): Promise<Vehicle[]> {
    const docs = await this.vehicleModel.find({ amenityIds: amenityId });
    return VehicleRepositoryMapper.toEntities(docs);
  }

  async findWithFilters(filter: VehicleFilter): Promise<Vehicle[]> {
    // Build MongoDB query object
    const query: Record<string, unknown> = {};

    // Filter by status(es) - use $in for multiple values
    if (filter.status && filter.status.length > 0) {
      if (filter.status.length === 1) {
        query.status = filter.status[0];
      } else {
        query.status = { $in: filter.status };
      }
    }

    // Filter by base fare range
    if (filter.baseFareMin !== undefined || filter.baseFareMax !== undefined) {
      const baseFareQuery: Record<string, number> = {};
      if (filter.baseFareMin !== undefined) {
        baseFareQuery.$gte = filter.baseFareMin;
      }
      if (filter.baseFareMax !== undefined) {
        baseFareQuery.$lte = filter.baseFareMax;
      }
      query.baseFare = baseFareQuery;
    }

    // Filter by minimum capacity (greater than or equal to)
    if (filter.capacity !== undefined) {
      query.capacity = { $gte: filter.capacity };
    }

    // Filter by year range
    if (filter.yearMin !== undefined || filter.yearMax !== undefined) {
      const yearQuery: Record<string, number> = {};
      if (filter.yearMin !== undefined) {
        yearQuery.$gte = filter.yearMin;
      }
      if (filter.yearMax !== undefined) {
        yearQuery.$lte = filter.yearMax;
      }
      query.year = yearQuery;
    }

    // Execute query
    const docs = await this.vehicleModel.find(query);
    return VehicleRepositoryMapper.toEntities(docs);
  }
}