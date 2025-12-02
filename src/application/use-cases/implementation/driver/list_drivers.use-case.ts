import { injectable, inject } from 'tsyringe';
import { IListDriversUseCase } from '../../interface/driver/list_drivers_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { ListDriversRequest, ListDriversResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { DriverStatus } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { DriverMapper } from '../../../mapper/driver.mapper';

/**
 * Allowed sort fields for driver sorting
 * Whitelist to prevent sorting by invalid fields
 */
const ALLOWED_SORT_FIELDS: readonly string[] = [
  'email',
  'fullName',
  'licenseNumber',
  'createdAt',
] as const;

/**
 * Use case for listing drivers (admin)
 * Retrieves drivers with pagination, filtering, and search
 */
@injectable()
export class ListDriversUseCase implements IListDriversUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(request: ListDriversRequest): Promise<ListDriversResponse> {
    // Normalize pagination parameters
    const normalizedPage = Math.max(1, Math.floor(request.page || 1));
    const normalizedLimit = Math.max(1, Math.min(100, Math.floor(request.limit || 20)));

    // Validate and normalize status filter
    let statusFilter: DriverStatus[] | undefined;
    if (request.status && request.status.length > 0) {
      statusFilter = request.status.filter((s: string): s is DriverStatus => {
        return Object.values(DriverStatus).includes(s as DriverStatus);
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
      status?: DriverStatus[];
      isOnboarded?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page: number;
      limit: number;
    } = {
      ...(statusFilter && { status: statusFilter }),
      ...(request.isOnboarded !== undefined && { isOnboarded: request.isOnboarded }),
      ...(request.search && { search: request.search }),
      ...(normalizedSortBy && { sortBy: normalizedSortBy }),
      sortOrder: normalizedSortOrder,
      page: normalizedPage,
      limit: normalizedLimit,
    };

    // Fetch drivers from repository
    const { drivers, total } = await this.driverRepository.findDriversWithFilters(filters);

    logger.info(
      `Admin listed drivers: ${drivers.length} drivers (page ${normalizedPage}, limit ${normalizedLimit}, total ${total})`
    );

    // Map to response DTOs using mapper
    return DriverMapper.toListDriversResponse(drivers, normalizedPage, normalizedLimit, total);
  }
}

