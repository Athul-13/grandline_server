import { vi } from 'vitest';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { User } from '../../../../domain/entities/user.entity';

/**
 * Mock implementation of IUserRepository
 * Use this in unit tests to avoid database dependencies
 */
export class MockUserRepository implements IUserRepository {
  findById = vi.fn<[string], Promise<User | null>>().mockResolvedValue(null);
  findByEmail = vi.fn<[string], Promise<User | null>>().mockResolvedValue(null);
  create = vi.fn<[User], Promise<void>>().mockResolvedValue(undefined);
  updateById = vi.fn<[string, Partial<User>], Promise<void>>().mockResolvedValue(undefined);
  deleteById = vi.fn<[string], Promise<void>>().mockResolvedValue(undefined);
  findAll = vi.fn<[], Promise<User[]>>().mockResolvedValue([]);
}

