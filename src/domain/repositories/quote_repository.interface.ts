import { QuoteStatus, TripType } from '../../shared/constants';
import { Quote } from '../entities/quote.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for Quote entity operations
 * Defines the contract for data access layer implementations
 */
export interface IQuoteRepository extends IBaseRepository<Quote> {
  /**
   * Finds quotes by user ID
   */
  findByUserId(userId: string): Promise<Quote[]>;

  /**
   * Finds quotes by status
   */
  findByStatus(status: QuoteStatus): Promise<Quote[]>;

  /**
   * Finds quotes by user ID and status
   */
  findByUserIdAndStatus(userId: string, status: QuoteStatus): Promise<Quote[]>;

  /**
   * Finds all non-deleted quotes for a user
   */
  findActiveQuotesByUserId(userId: string): Promise<Quote[]>;

  /**
   * Finds all quotes (including deleted) for a user
   */
  findAllQuotesByUserId(userId: string): Promise<Quote[]>;

  /**
   * Soft deletes a quote by setting isDeleted to true
   */
  softDelete(quoteId: string): Promise<void>;

  /**
   * Finds quotes by trip type
   */
  findByTripType(tripType: TripType): Promise<Quote[]>;

  /**
   * Finds all quotes for admin view
   */
  findAllForAdmin(
    includeDeleted: boolean,
    statuses?: QuoteStatus[],
    userIds?: string[]
  ): Promise<Quote[]>;
}

