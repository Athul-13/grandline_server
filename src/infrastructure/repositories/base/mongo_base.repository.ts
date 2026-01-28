import { ClientSession } from 'mongoose';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';

export abstract class MongoBaseRepository<TModel, TEntity> {
  protected constructor(
    protected readonly model: IDatabaseModel<TModel>,
    private readonly idField: string = 'userId',
  ) {}

  protected abstract toEntity(doc: TModel): TEntity;
  protected abstract toPersistence(entity: TEntity): Partial<TModel>;

  async findById(id: string): Promise<TEntity | null> {
    const filter = { [this.idField]: id };
    const doc: TModel | null = await this.model.findOne(filter);
    return doc ? this.toEntity(doc) : null;
  }

  async create(entity: TEntity, session?: ClientSession): Promise<void> {
    const data = this.toPersistence(entity);
    await this.model.create(data, session ? { session } : undefined);
  }

  async updateById(id: string, update: Partial<TEntity>, session?: ClientSession): Promise<void> {
    const filter = { [this.idField]: id };
    // Filter out undefined values - MongoDB $set doesn't handle undefined correctly
    const cleanUpdate = Object.fromEntries(
      Object.entries(update).filter(([_, value]) => value !== undefined)
    ) as Record<string, unknown>;
    await this.model.updateOne(filter, { $set: cleanUpdate }, session ? { session } : undefined);
  }

  async deleteById(id: string): Promise<void> {
    const filter = { [this.idField]: id };
    await this.model.deleteOne(filter);
  }
}
