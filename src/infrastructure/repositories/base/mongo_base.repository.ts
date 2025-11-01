import { Model, FilterQuery, UpdateQuery, AnyKeys } from 'mongoose';

export abstract class MongoBaseRepository<TModel, TEntity> {
  protected constructor(
    protected readonly model: Model<TModel>,
    private readonly idField: string = 'userId',
  ) {}

  protected abstract toEntity(doc: TModel): TEntity;
  protected abstract toPersistence(entity: TEntity): AnyKeys<TModel>;

  async findById(id: string): Promise<TEntity | null> {
    const filter = { [this.idField]: id } as FilterQuery<TModel>;
    const doc = await this.model
      .findOne(filter)
      .lean<TModel>()
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(entity: TEntity): Promise<void> {
    const data = this.toPersistence(entity);
    await this.model.create(data);
  }

  async updateById(id: string, update: Partial<TEntity>): Promise<void> {
    const filter = { [this.idField]: id } as FilterQuery<TModel>;
    await this.model
      .updateOne(
        filter,
        { $set: update as unknown as UpdateQuery<TModel> }
      )
      .exec();
  }

  async deleteById(id: string): Promise<void> {
    const filter = { [this.idField]: id } as FilterQuery<TModel>;
    await this.model.deleteOne(filter).exec();
  }
}
