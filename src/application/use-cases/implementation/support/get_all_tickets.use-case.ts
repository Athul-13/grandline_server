import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ActorType, TicketStatus, UserRole, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { GetAllTicketsRequest, GetAllTicketsResponse } from '../../../dtos/ticket.dto';
import { IGetAllTicketsUseCase } from '../../interface/support/get_all_tickets_use_case.interface';

/**
 * Use case for getting all tickets (admin only)
 * Supports filtering by status, actorType, assignedAdminId
 * Supports pagination and sorting
 */
@injectable()
export class GetAllTicketsUseCase implements IGetAllTicketsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.ITicketRepository)
    private readonly ticketRepository: ITicketRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository
  ) {}

  async execute(request: GetAllTicketsRequest, requesterId: string): Promise<GetAllTicketsResponse> {
    // Input validation
    if (!requesterId || typeof requesterId !== 'string' || requesterId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUESTER_ID', 400);
    }

    // Authorization: Only admins can access all tickets
    const requesterUser = await this.userRepository.findById(requesterId);
    if (!requesterUser || requesterUser.role !== UserRole.ADMIN) {
      logger.warn(`Non-admin user ${requesterId} attempted to get all tickets`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Normalize pagination parameters
    const page = Math.max(1, Math.floor(request.page || 1));
    const limit = Math.max(1, Math.min(100, Math.floor(request.limit || 20)));

    // Validate filters
    if (request.status && !Object.values(TicketStatus).includes(request.status)) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_STATUS', 400);
    }

    if (request.actorType && !Object.values(ActorType).includes(request.actorType)) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_ACTOR_TYPE', 400);
    }

    // Validate sort parameters
    const sortBy = request.sortBy === 'lastMessageAt' || request.sortBy === 'createdAt' 
      ? request.sortBy 
      : 'lastMessageAt';
    const sortOrder = request.sortOrder === 'asc' || request.sortOrder === 'desc' 
      ? request.sortOrder 
      : 'desc';

    // If search query exists, search for matching users/drivers by name
    const matchingActorIds: string[] = [];
    if (request.search && request.search.trim().length > 0) {
      const searchQuery = request.search.trim();
      
      // Search users if actorType is not specified or is USER
      if (!request.actorType || request.actorType === ActorType.USER) {
        try {
          const { users } = await this.userRepository.findRegularUsersWithFilters({
            search: searchQuery,
            limit: 100, // Get up to 100 matching users
          });
          matchingActorIds.push(...users.map(user => user.userId));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`Error searching users by name: ${errorMessage}`);
        }
      }

      // Search drivers if actorType is not specified or is DRIVER
      if (!request.actorType || request.actorType === ActorType.DRIVER) {
        try {
          const { drivers } = await this.driverRepository.findDriversWithFilters({
            search: searchQuery,
            limit: 100, // Get up to 100 matching drivers
          });
          matchingActorIds.push(...drivers.map(driver => driver.driverId));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`Error searching drivers by name: ${errorMessage}`);
        }
      }
    }

    // Use new repository method for database-level pagination and search
    const { tickets, total } = await this.ticketRepository.findAllWithFilters({
      status: request.status,
      actorType: request.actorType,
      assignedAdminId: request.assignedAdminId,
      search: request.search,
      actorIds: matchingActorIds.length > 0 ? matchingActorIds : undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info(
      `Admin tickets list: returning ${tickets.length} tickets out of ${total} total (page ${page}, filters: status=${request.status || 'all'}, actorType=${request.actorType || 'all'}, assignedAdminId=${request.assignedAdminId || 'all'}, search=${request.search || 'none'})`
    );

    // Fetch actor names (user or driver) for paginated tickets only
    const actorIdsByType = new Map<ActorType, Set<string>>();
    tickets.forEach((ticket) => {
      if (!actorIdsByType.has(ticket.actorType)) {
        actorIdsByType.set(ticket.actorType, new Set());
      }
      actorIdsByType.get(ticket.actorType)!.add(ticket.actorId);
    });

    // Fetch users
    const usersMap = new Map<string, string>(); // actorId -> fullName
    const userIds = actorIdsByType.get(ActorType.USER);
    if (userIds) {
      for (const userId of userIds) {
        try {
          const user = await this.userRepository.findById(userId);
          if (user) {
            usersMap.set(userId, user.fullName);
          }
        } catch {
          logger.warn(`User not found for ticket: ${userId}`);
        }
      }
    }

    // Fetch drivers
    const driversMap = new Map<string, string>(); // actorId -> fullName
    const driverIds = actorIdsByType.get(ActorType.DRIVER);
    if (driverIds) {
      for (const driverId of driverIds) {
        try {
          const driver = await this.driverRepository.findById(driverId);
          if (driver) {
            driversMap.set(driverId, driver.fullName);
          }
        } catch {
          logger.warn(`Driver not found for ticket: ${driverId}`);
        }
      }
    }

    // Convert to response format with actor names
    const ticketResponses = tickets.map((ticket) => {
      let actorName = 'Unknown';
      if (ticket.actorType === ActorType.USER) {
        actorName = usersMap.get(ticket.actorId) || 'Unknown User';
      } else if (ticket.actorType === ActorType.DRIVER) {
        actorName = driversMap.get(ticket.actorId) || 'Unknown Driver';
      }

      return {
        ticketId: ticket.ticketId,
        actorType: ticket.actorType,
        actorId: ticket.actorId,
        actorName,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        linkedEntityType: ticket.linkedEntityType,
        linkedEntityId: ticket.linkedEntityId,
        assignedAdminId: ticket.assignedAdminId,
        lastMessageAt: ticket.lastMessageAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      };
    });

    return {
      tickets: ticketResponses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}

