import { injectable, inject } from 'tsyringe';
import { IListUsersUseCase } from '../../interface/user/list_users_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ListUsersRequest, ListUsersResponse, UserListItem } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { UserStatus } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';

/**
 * Allowed sort fields for user sorting
 * Whitelist to prevent sorting by invalid fields
 */
const ALLOWED_SORT_FIELDS: readonly string[] = [
  'email',
  'fullName',
  'createdAt',
] as const;

/**
 * Use case for listing users (admin)
 * Retrieves regular users with pagination, filtering, and search
 * Excludes admin users from results
 */
@injectable()
export class ListUsersUseCase implements IListUsersUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: ListUsersRequest): Promise<ListUsersResponse> {
    // Normalize pagination parameters
    const normalizedPage = Math.max(1, Math.floor(request.page || 1));
    const normalizedLimit = Math.max(1, Math.min(100, Math.floor(request.limit || 20)));

    // Validate and normalize status filter
    let statusFilter: UserStatus[] | undefined;
    if (request.status && request.status.length > 0) {
      statusFilter = request.status.filter((s: string): s is UserStatus => {
        return Object.values(UserStatus).includes(s as UserStatus);
      });
      if (statusFilter.length === 0) {
        statusFilter = undefined;
      }
    }

    // Validate sortBy field
    const normalizedSortBy = request.sortBy && ALLOWED_SORT_FIELDS.includes(request.sortBy)
      ? request.sortBy
      : undefined;

    // Validate sortOrder
    const normalizedSortOrder = request.sortOrder === 'desc' ? 'desc' : 'asc';

    // Build repository filters
    const filters: {
      status?: UserStatus[];
      isVerified?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page: number;
      limit: number;
    } = {
      ...(statusFilter && { status: statusFilter }),
      ...(request.isVerified !== undefined && { isVerified: request.isVerified }),
      ...(request.search && { search: request.search }),
      ...(normalizedSortBy && { sortBy: normalizedSortBy }),
      sortOrder: normalizedSortOrder,
      page: normalizedPage,
      limit: normalizedLimit,
    };

    // Fetch users from repository
    const { users, total } = await this.userRepository.findRegularUsersWithFilters(filters);

    // Map to response DTOs
    const usersData: UserListItem[] = users.map((user) => ({
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      status: user.status,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / normalizedLimit);

    logger.info(
      `Admin listed users: ${usersData.length} users (page ${normalizedPage}, limit ${normalizedLimit}, total ${total})`
    );

    return {
      users: usersData,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    };
  }
}

