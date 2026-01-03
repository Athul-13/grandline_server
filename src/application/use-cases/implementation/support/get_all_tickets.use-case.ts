import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { Ticket } from '../../../../domain/entities/ticket.entity';
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
      : 'lastMessageAt'; // Default to lastMessageAt
    const sortOrder = request.sortOrder === 'asc' || request.sortOrder === 'desc' 
      ? request.sortOrder 
      : 'desc'; // Default to desc (most recent first)

    // Fetch tickets based on filters
    let tickets: Ticket[] = [];

    if (request.assignedAdminId && request.status) {
      // Filter by assigned admin and status
      tickets = await this.ticketRepository.findByAssignedAdminAndStatus(
        request.assignedAdminId,
        request.status
      );
    } else if (request.assignedAdminId) {
      // Filter by assigned admin only
      tickets = await this.ticketRepository.findByAssignedAdmin(request.assignedAdminId);
    } else if (request.status && request.actorType) {
      // Filter by status and actorType - need to filter in memory
      const statusTickets = await this.ticketRepository.findByStatus(request.status);
      tickets = statusTickets.filter((t) => t.actorType === request.actorType);
    } else if (request.status) {
      // Filter by status only
      tickets = await this.ticketRepository.findByStatus(request.status);
    } else if (request.actorType) {
      // Filter by actorType only
      tickets = await this.ticketRepository.findByActorType(request.actorType);
    } else {
      // No filters - get all tickets by combining results
      // Note: This is not ideal for large datasets, but works for now
      // In production, consider adding a findAll method to repository
      const userTickets = await this.ticketRepository.findByActorType(ActorType.USER);
      const driverTickets = await this.ticketRepository.findByActorType(ActorType.DRIVER);
      tickets = [...userTickets, ...driverTickets];
    }

    // Apply sorting
    tickets = this.sortTickets(tickets, sortBy, sortOrder);

    // Calculate pagination
    const total = tickets.length;
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTickets = tickets.slice(startIndex, endIndex);

    logger.info(
      `Admin tickets list: returning ${paginatedTickets.length} tickets out of ${total} total (page ${page}, filters: status=${request.status || 'all'}, actorType=${request.actorType || 'all'}, assignedAdminId=${request.assignedAdminId || 'all'})`
    );

    // Fetch actor names (user or driver) for all tickets
    const actorIdsByType = new Map<ActorType, Set<string>>();
    paginatedTickets.forEach((ticket) => {
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
    const ticketResponses = paginatedTickets.map((ticket) => {
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

  /**
   * Sorts tickets array based on the specified field and order
   */
  private sortTickets(
    tickets: Ticket[],
    sortBy: 'lastMessageAt' | 'createdAt',
    sortOrder: 'asc' | 'desc'
  ): Ticket[] {
    return [...tickets].sort((a, b) => {
      let aValue: Date | null;
      let bValue: Date | null;

      if (sortBy === 'lastMessageAt') {
        aValue = a.lastMessageAt || a.createdAt; // Fallback to createdAt if lastMessageAt is null
        bValue = b.lastMessageAt || b.createdAt;
      } else {
        aValue = a.createdAt;
        bValue = b.createdAt;
      }

      // Handle null values (shouldn't happen with fallback, but just in case)
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue.getTime() - bValue.getTime();
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}

