import { PricingConfig } from '../../domain/entities/pricing_config.entity';
import { IPricingConfigModel } from '../database/mongodb/models/pricing_config.model';

/**
 * Repository mapper for PricingConfig entity
 * Converts MongoDB documents to domain entities
 */
export class PricingConfigRepositoryMapper {
  static toEntity(doc: IPricingConfigModel): PricingConfig {
    return new PricingConfig(
      doc.pricingConfigId,
      doc.version,
      doc.fuelPrice,
      doc.averageDriverPerHourRate,
      doc.taxPercentage,
      doc.nightChargePerNight,
      doc.isActive,
      doc.createdBy,
      doc.createdAt,
      doc.updatedAt
    );
  }

  static toEntities(docs: IPricingConfigModel[]): PricingConfig[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

