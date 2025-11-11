import { PricingConfig } from '../entities/pricing_config.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for PricingConfig entity operations
 * Defines the contract for data access layer implementations
 */
export interface IPricingConfigRepository extends IBaseRepository<PricingConfig> {
  /**
   * Finds the active pricing configuration
   */
  findActive(): Promise<PricingConfig | null>;

  /**
   * Finds all pricing configurations ordered by version (descending)
   */
  findAllOrderedByVersion(): Promise<PricingConfig[]>;

  /**
   * Finds pricing configuration by version
   */
  findByVersion(version: number): Promise<PricingConfig | null>;

  /**
   * Finds the latest version number
   */
  findLatestVersion(): Promise<number>;

  /**
   * Deactivates all pricing configurations
   */
  deactivateAll(): Promise<void>;

  /**
   * Activates a specific pricing configuration by ID
   */
  activate(pricingConfigId: string): Promise<void>;
}

