import { Model, FilterQuery } from 'mongoose';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';

/**
 * MongoDB model implementation
 */
export class MongoDBModelImpl<T> implements IDatabaseModel<T> {
  constructor(private readonly model: Model<T>) {}

  async findOne(filter: Record<string, unknown>, options?: { select?: string }): Promise<T | null> {
    let query = this.model.findOne(filter as FilterQuery<T>);
    
    if (options?.select) {
      query = query.select(options.select);
    }
    
    const doc = await query.lean<T>().exec();
    return doc || null;
  }

  async find(filter: Record<string, unknown>): Promise<T[]> {
    const docs = await this.model.find(filter as FilterQuery<T>).lean<T>().exec();
    return docs;
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toObject() as T;
  }

  async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<{ matchedCount: number }> {
    const result = await this.model.updateOne(filter as FilterQuery<T>, update).exec();
    return { matchedCount: result.matchedCount };
  }

  async deleteOne(filter: Record<string, unknown>): Promise<void> {
    await this.model.deleteOne(filter as FilterQuery<T>).exec();
  }
}

