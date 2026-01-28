import { Model, FilterQuery, PipelineStage, ClientSession } from 'mongoose';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';

/**
 * MongoDB model implementation
 */
export class MongoDBModelImpl<T> implements IDatabaseModel<T> {
  constructor(private readonly model: Model<T>) {}

  async findOne(filter: Record<string, unknown>, options?: { select?: string; sort?: Record<string, 1 | -1>; session?: ClientSession }): Promise<T | null> {
    let query = this.model.findOne(filter as FilterQuery<T>);
    
    if (options?.select) {
      query = query.select(options.select) as typeof query;
    }
    
    if (options?.sort) {
      query = query.sort(options.sort);
    }

    if (options?.session) {
      query = query.session(options.session);
    }
    
    const doc = await query.lean<T>().exec();
    return (doc as T | null) || null;
  }

  async find(filter: Record<string, unknown>, options?: { sort?: Record<string, 1 | -1>; session?: ClientSession }): Promise<T[]> {
    let query = this.model.find(filter as FilterQuery<T>);
    
    if (options?.sort) {
      query = query.sort(options.sort);
    }

    if (options?.session) {
      query = query.session(options.session);
    }
    
    const docs = await query.lean<T>().exec();
    return docs as T[];
  }

  async create(data: Partial<T>, options?: { session?: ClientSession }): Promise<T> {
    if (options?.session) {
      const doc = await this.model.create([data], { session: options.session });
      return doc[0].toObject() as T;
    }
    const doc = await this.model.create(data);
    return doc.toObject() as T;
  }

  async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>, options?: { session?: ClientSession }): Promise<{ matchedCount: number }> {
    let query = this.model.updateOne(filter as FilterQuery<T>, update);
    if (options?.session) {
      query = query.session(options.session);
    }
    const result = await query.exec();
    return { matchedCount: result.matchedCount };
  }

  async updateMany(filter: Record<string, unknown>, update: Record<string, unknown>, options?: { session?: ClientSession }): Promise<{ matchedCount: number }> {
    let query = this.model.updateMany(filter as FilterQuery<T>, update);
    if (options?.session) {
      query = query.session(options.session);
    }
    const result = await query.exec();
    return { matchedCount: result.matchedCount };
  }

  async deleteOne(filter: Record<string, unknown>, options?: { session?: ClientSession }): Promise<void> {
    let query = this.model.deleteOne(filter as FilterQuery<T>);
    if (options?.session) {
      query = query.session(options.session);
    }
    await query.exec();
  }

  async deleteMany(filter: Record<string, unknown>, options?: { session?: ClientSession }): Promise<void> {
    let query = this.model.deleteMany(filter as FilterQuery<T>);
    if (options?.session) {
      query = query.session(options.session);
    }
    await query.exec();
  }

  async aggregate(pipeline: unknown[], options?: { session?: ClientSession }): Promise<unknown[]> {
    let agg = this.model.aggregate(pipeline as PipelineStage[]);
    if (options?.session) {
      agg = agg.session(options.session);
    }
    const result = await agg.exec();
    return result as unknown[];
  }
}

