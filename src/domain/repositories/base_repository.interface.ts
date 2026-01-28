import { ClientSession } from 'mongoose';

export interface IBaseRepository<TEntity> {
  findById(id: string): Promise<TEntity | null>;
  create(entity: TEntity, session?: ClientSession): Promise<void>;
  updateById(id: string, update: Partial<TEntity>, session?: ClientSession): Promise<void>;
  deleteById(id: string): Promise<void>;
}
