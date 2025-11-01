export interface IBaseRepository<TEntity> {
  findById(id: string): Promise<TEntity | null>;
  create(entity: TEntity): Promise<void>;
  updateById(id: string, update: Partial<TEntity>): Promise<void>;
  deleteById(id: string): Promise<void>;
}
