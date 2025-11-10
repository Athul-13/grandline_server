import { injectable } from 'tsyringe';
import { IVehicleRepository } from '../../domain/repositories/vehicle_repository.interface';
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
}