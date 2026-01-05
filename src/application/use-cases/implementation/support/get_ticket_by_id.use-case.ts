import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { UserRole, ERROR_MESSAGES, ERROR_CODES, LinkedEntityType } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { GetTicketByIdResponse } from '../../../dtos/ticket.dto';
import { IGetTicketByIdUseCase } from '../../interface/support/get_ticket_by_id_use_case.interface';

/**
 * Use case for getting a ticket by ID
 * Enforces authorization: users/drivers can only access their own tickets, admins can access any
 */
@injectable()
export class GetTicketByIdUseCase implements IGetTicketByIdUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.ITicketRepository)
    private readonly ticketRepository: ITicketRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(ticketId: string, requesterId: string): Promise<GetTicketByIdResponse> {
    // Input validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_TICKET_ID', 400);
    }

    if (!requesterId || typeof requesterId !== 'string' || requesterId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUESTER_ID', 400);
    }

    // Get ticket
    const ticket = await this.ticketRepository.findById(ticketId);

    if (!ticket) {
      logger.warn(`Attempt to get non-existent ticket: ${ticketId}`);
      throw new AppError('Ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    // Check if requester is admin
    const requesterUser = await this.userRepository.findById(requesterId);
    const isAdmin = requesterUser?.role === UserRole.ADMIN;

    // Authorization: Non-admins can only access their own tickets
    if (!isAdmin && !ticket.isActor(requesterId)) {
      logger.warn(`User ${requesterId} attempted to get ticket ${ticketId} without permission`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Fetch linked entity number if linked entity exists
    let linkedEntityNumber: string | null = null;
    if (ticket.linkedEntityType && ticket.linkedEntityId) {
      try {
        if (ticket.linkedEntityType === LinkedEntityType.QUOTE) {
          const quote = await this.quoteRepository.findById(ticket.linkedEntityId);
          if (quote) {
            linkedEntityNumber = quote.quoteNumber;
          }
        } else if (ticket.linkedEntityType === LinkedEntityType.RESERVATION) {
          const reservation = await this.reservationRepository.findById(ticket.linkedEntityId);
          if (reservation) {
            linkedEntityNumber = reservation.reservationNumber;
          }
        }
      } catch (error) {
        // Log error but don't fail the request if entity lookup fails
        logger.warn(`Failed to fetch linked entity number for ticket ${ticket.ticketId}:`, error);
      }
    }

    // Convert to response format
    return {
      ticketId: ticket.ticketId,
      actorType: ticket.actorType,
      actorId: ticket.actorId,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      linkedEntityType: ticket.linkedEntityType,
      linkedEntityId: ticket.linkedEntityId,
      linkedEntityNumber,
      assignedAdminId: ticket.assignedAdminId,
      lastMessageAt: ticket.lastMessageAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }
}

