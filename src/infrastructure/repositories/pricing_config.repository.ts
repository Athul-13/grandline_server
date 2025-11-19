import { injectable } from 'tsyringe';
import { IPricingConfigRepository } from '../../domain/repositories/pricing_config_repository.interface';
import { PricingConfig } from '../../domain/entities/pricing_config.entity';
import {
  IPricingConfigModel,
  createPricingConfigModel,
} from '../database/mongodb/models/pricing_config.model';
import { PricingConfigRepositoryMapper } from '../mappers/pricing_config_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

/**
 * PricingConfig repository implementation
 * Handles data persistence operations for PricingConfig entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class PricingConfigRepositoryImpl
  extends MongoBaseRepository<IPricingConfigModel, PricingConfig>
  implements IPricingConfigRepository {
  private readonly pricingConfigModel: IDatabaseModel<IPricingConfigModel>;

  constructor() {
    const model = createPricingConfigModel();
    super(model, 'pricingConfigId');
    this.pricingConfigModel = model;
  }

  protected toEntity(doc: IPricingConfigModel): PricingConfig {
    return PricingConfigRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: PricingConfig): Partial<IPricingConfigModel> {
    return {
      pricingConfigId: entity.pricingConfigId,
      version: entity.version,
      fuelPrice: entity.fuelPrice,
      averageDriverPerHourRate: entity.averageDriverPerHourRate,
      taxPercentage: entity.taxPercentage,
      nightChargePerNight: entity.nightChargePerNight,
      isActive: entity.isActive,
      createdBy: entity.createdBy,
    };
  }

  async findActive(): Promise<PricingConfig | null> {
    const doc = await this.pricingConfigModel.findOne({ isActive: true });
    return doc ? this.toEntity(doc) : null;
  }

  async findAllOrderedByVersion(): Promise<PricingConfig[]> {
    const docs = await this.pricingConfigModel.find({}, { sort: { version: -1 } });
    return PricingConfigRepositoryMapper.toEntities(docs);
  }

  async findByVersion(version: number): Promise<PricingConfig | null> {
    const doc = await this.pricingConfigModel.findOne({ version });
    return doc ? this.toEntity(doc) : null;
  }

  async findLatestVersion(): Promise<number> {
    const doc = await this.pricingConfigModel.findOne({}, { sort: { version: -1 } });
    return doc ? doc.version : 0;
  }

  async deactivateAll(): Promise<void> {
    await this.pricingConfigModel.updateMany({}, { $set: { isActive: false } });
  }

  async activate(pricingConfigId: string): Promise<void> {
    // First deactivate all
    await this.deactivateAll();
    // Then activate the specified one
    await this.pricingConfigModel.updateOne({ pricingConfigId }, { $set: { isActive: true } });
  }
}

