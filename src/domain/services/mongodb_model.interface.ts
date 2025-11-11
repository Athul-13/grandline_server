/**
 * MongoDB model interface
 * Defines the contract for MongoDB model operations
 * Allows repositories to depend on abstraction instead of concrete Mongoose implementation
 */
export interface IDatabaseModel<T> {
  /**
   * Finds a single document by filter
   */
  findOne(filter: Record<string, unknown>, options?: { select?: string }): Promise<T | null>;

  /**
   * Finds multiple documents by filter
   */
  find(filter: Record<string, unknown>): Promise<T[]>;

  /**
   * Creates a new document
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Updates a single document
   */
  updateOne(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<{ matchedCount: number }>;

  /**
   * Deletes a single document
   */
  deleteOne(filter: Record<string, unknown>): Promise<void>;

  /**
   * Deletes multiple documents
   */
  deleteMany(filter: Record<string, unknown>): Promise<void>;

  /**
   * Executes an aggregation pipeline
   */
  aggregate(pipeline: unknown[]): Promise<unknown[]>;
}

