import { vi } from 'vitest';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { User } from '../../../../domain/entities/user.entity';
import { UserRole, UserStatus } from '../../../../shared/constants';

/**
 * Mock implementation of IUserRepository
 * Use this in unit tests to avoid database dependencies
 */
export class MockUserRepository implements IUserRepository {
  findById = vi.fn<[string], Promise<User | null>>().mockResolvedValue(null);
  findByEmail = vi.fn<[string], Promise<User | null>>().mockResolvedValue(null);
  findByEmailIncludingDeleted = vi.fn<[string], Promise<User | null>>().mockResolvedValue(null);
  findByGoogleId = vi.fn<[string], Promise<User | null>>().mockResolvedValue(null);
  findByRole = vi.fn<[UserRole], Promise<User[]>>().mockResolvedValue([]);
  updateVerificationStatus = vi.fn<[string, boolean], Promise<User>>().mockRejectedValue(new Error('Not implemented'));
  createUser = vi.fn<[User, string | undefined], Promise<void>>().mockResolvedValue(undefined);
  getPasswordHash = vi.fn<[string], Promise<string>>().mockResolvedValue('');
  updatePassword = vi.fn<[string, string], Promise<void>>().mockResolvedValue(undefined);
  linkGoogleAccount = vi.fn<[string, string], Promise<User>>().mockRejectedValue(new Error('Not implemented'));
  updateUserProfile = vi
    .fn<[string, { fullName?: string; phoneNumber?: string; profilePicture?: string }], Promise<User>>()
    .mockRejectedValue(new Error('Not implemented'));
  findRegularUsersWithFilters = vi
    .fn<
      [
        {
          status?: UserStatus[];
          isVerified?: boolean;
          search?: string;
          sortBy?: string;
          sortOrder?: 'asc' | 'desc';
          page?: number;
          limit?: number;
        },
      ],
      Promise<{ users: User[]; total: number }>
    >()
    .mockResolvedValue({ users: [], total: 0 });
  updateUserStatus = vi.fn<[string, UserStatus], Promise<User>>().mockRejectedValue(new Error('Not implemented'));
  updateUserRole = vi.fn<[string, UserRole], Promise<User>>().mockRejectedValue(new Error('Not implemented'));
  getUserStatistics = vi
    .fn<[({ startDate?: Date; endDate?: Date } | undefined)?], Promise<{
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      blockedUsers: number;
      verifiedUsers: number;
      unverifiedUsers: number;
      newUsers: number;
      usersByStatus: Record<string, number>;
    }>>()
    .mockResolvedValue({
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      blockedUsers: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      newUsers: 0,
      usersByStatus: {},
    });
  softDelete = vi.fn<[string], Promise<void>>().mockResolvedValue(undefined);
  findByIds = vi.fn<[string[]], Promise<Map<string, User>>>().mockResolvedValue(new Map());
  create = vi.fn<[User], Promise<void>>().mockResolvedValue(undefined);
  updateById = vi.fn<[string, Partial<User>], Promise<void>>().mockResolvedValue(undefined);
  deleteById = vi.fn<[string], Promise<void>>().mockResolvedValue(undefined);
  findAll = vi.fn<[], Promise<User[]>>().mockResolvedValue([]);
}

