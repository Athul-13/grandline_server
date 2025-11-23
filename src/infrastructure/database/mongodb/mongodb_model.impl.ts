import { Model, FilterQuery, PipelineStage } from 'mongoose';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';

/**
 * MongoDB model implementation
 */
export class MongoDBModelImpl<T> implements IDatabaseModel<T> {
  constructor(private readonly model: Model<T>) {}

  async findOne(filter: Record<string, unknown>, options?: { select?: string; sort?: Record<string, 1 | -1> }): Promise<T | null> {
    let query = this.model.findOne(filter as FilterQuery<T>);
    
    if (options?.select) {
      query = query.select(options.select) as typeof query;
    }
    
    if (options?.sort) {
      query = query.sort(options.sort);
    }
    
    const doc = await query.lean<T>().exec();
    return (doc as T | null) || null;
  }

  async find(filter: Record<string, unknown>, options?: { sort?: Record<string, 1 | -1> }): Promise<T[]> {
    let query = this.model.find(filter as FilterQuery<T>);
    
    if (options?.sort) {
      query = query.sort(options.sort);
    }
    
    const docs = await query.lean<T>().exec();
    return docs as T[];
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toObject() as T;
  }

  async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<{ matchedCount: number }> {
    const result = await this.model.updateOne(filter as FilterQuery<T>, update).exec();
    return { matchedCount: result.matchedCount };
  }

  async updateMany(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<{ matchedCount: number }> {
    const result = await this.model.updateMany(filter as FilterQuery<T>, update).exec();
    return { matchedCount: result.matchedCount };
  }

  async deleteOne(filter: Record<string, unknown>): Promise<void> {
    await this.model.deleteOne(filter as FilterQuery<T>).exec();
  }

  async deleteMany(filter: Record<string, unknown>): Promise<void> {
    await this.model.deleteMany(filter as FilterQuery<T>).exec();
  }

  async aggregate(pipeline: unknown[]): Promise<unknown[]> {
    const result = await this.model.aggregate(pipeline as PipelineStage[]).exec();
    return result as unknown[];
  }
}

