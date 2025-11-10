import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

export abstract class MongoBaseRepository<TModel, TEntity> {
  protected constructor(
    protected readonly model: IDatabaseModel<TModel>,
    private readonly idField: string = 'userId',
  ) {}

  protected abstract toEntity(doc: TModel): TEntity;
  protected abstract toPersistence(entity: TEntity): Partial<TModel>;

  async findById(id: string): Promise<TEntity | null> {
    const filter = { [this.idField]: id };
    const doc = await this.model.findOne(filter);
    return doc ? this.toEntity(doc) : null;
  }

  async create(entity: TEntity): Promise<void> {
    const data = this.toPersistence(entity);
    await this.model.create(data);
  }

  async updateById(id: string, update: Partial<TEntity>): Promise<void> {
    const filter = { [this.idField]: id };
    // Filter out undefined values - MongoDB $set doesn't handle undefined correctly
    const cleanUpdate = Object.fromEntries(
      Object.entries(update).filter(([_, value]) => value !== undefined)
    ) as Partial<TEntity>;
    await this.model.updateOne(filter, { $set: cleanUpdate });
  }

  async deleteById(id: string): Promise<void> {
    const filter = { [this.idField]: id };
    await this.model.deleteOne(filter);
  }
}
