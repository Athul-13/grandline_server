import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { Ticket } from '../../../../domain/entities/ticket.entity';
import { TicketStatus, UserRole, ERROR_MESSAGES, ERROR_CODES, NotificationType, ActorType, LinkedEntityType } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { GetTicketByIdResponse } from '../../../dtos/ticket.dto';
import { IUpdateTicketStatusUseCase, UpdateTicketStatusRequest } from '../../interface/support/update_ticket_status_use_case.interface';
import { INotificationService } from '../../../../domain/services/notification_service.interface';

/**
 * Use case for updating ticket status
 * Admin only - validates status transitions
 */
@injectable()
export class UpdateTicketStatusUseCase implements IUpdateTicketStatusUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.ITicketRepository)
    private readonly ticketRepository: ITicketRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.INotificationService)
    private readonly notificationService: INotificationService,
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(
    ticketId: string,
    request: UpdateTicketStatusRequest,
    requesterId: string
  ): Promise<GetTicketByIdResponse> {
    // Input validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_TICKET_ID', 400);
    }

    if (!requesterId || typeof requesterId !== 'string' || requesterId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUESTER_ID', 400);
    }

    if (!request || !request.status) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    if (!Object.values(TicketStatus).includes(request.status)) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_STATUS', 400);
    }

    // Authorization: Only admins can update ticket status
    const requesterUser = await this.userRepository.findById(requesterId);
    if (!requesterUser || requesterUser.role !== UserRole.ADMIN) {
      logger.warn(`Non-admin user ${requesterId} attempted to update ticket status`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Get ticket
    const ticket = await this.ticketRepository.findById(ticketId);

    if (!ticket) {
      logger.warn(`Attempt to update status of non-existent ticket: ${ticketId}`);
      throw new AppError('Ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    // Validate status transition (business rule)
    // Allow any status transition for now - can be made more restrictive later
    // For example: can't go from RESOLVED to OPEN, etc.

    // Update ticket status
    await this.ticketRepository.updateById(ticketId, {
      status: request.status,
    } as Partial<Ticket>);

    // Fetch updated ticket
    const updatedTicket = await this.ticketRepository.findById(ticketId);
    if (!updatedTicket) {
      throw new AppError('Ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    logger.info(`Ticket status updated: ${ticketId} from ${ticket.status} to ${request.status} by admin: ${requesterId}`);

    // Send notification to user if status changed to RESOLVED or REJECTED
    // Only send if the ticket was created by a user (not driver or admin)
    if (
      updatedTicket.actorType === ActorType.USER &&
      (request.status === TicketStatus.RESOLVED || request.status === TicketStatus.REJECTED)
    ) {
      const statusMessage = request.status === TicketStatus.RESOLVED
        ? 'Your support ticket has been resolved.'
        : 'Your support ticket has been rejected.';

      await this.notificationService.sendNotification({
        userId: updatedTicket.actorId,
        type: NotificationType.TICKET_STATUS_CHANGED,
        title: `Ticket ${request.status === TicketStatus.RESOLVED ? 'Resolved' : 'Rejected'}: ${updatedTicket.subject}`,
        message: statusMessage,
      });
      logger.info(`Notification sent to user: ${updatedTicket.actorId} for ticket status change: ${ticketId}`);
    }

    // Fetch linked entity number if linked entity exists
    let linkedEntityNumber: string | null = null;
    if (updatedTicket.linkedEntityType && updatedTicket.linkedEntityId) {
      try {
        if (updatedTicket.linkedEntityType === LinkedEntityType.QUOTE) {
          const quote = await this.quoteRepository.findById(updatedTicket.linkedEntityId);
          if (quote) {
            linkedEntityNumber = quote.quoteNumber;
          }
        } else if (updatedTicket.linkedEntityType === LinkedEntityType.RESERVATION) {
          const reservation = await this.reservationRepository.findById(updatedTicket.linkedEntityId);
          if (reservation) {
            linkedEntityNumber = reservation.reservationNumber;
          }
        }
      } catch (error) {
        // Log error but don't fail the request if entity lookup fails
        logger.warn(`Failed to fetch linked entity number for ticket ${ticketId}:`, error);
      }
    }

    // Convert to response format
    return {
      ticketId: updatedTicket.ticketId,
      actorType: updatedTicket.actorType,
      actorId: updatedTicket.actorId,
      subject: updatedTicket.subject,
      status: updatedTicket.status,
      priority: updatedTicket.priority,
      linkedEntityType: updatedTicket.linkedEntityType,
      linkedEntityId: updatedTicket.linkedEntityId,
      linkedEntityNumber,
      assignedAdminId: updatedTicket.assignedAdminId,
      lastMessageAt: updatedTicket.lastMessageAt,
      createdAt: updatedTicket.createdAt,
      updatedAt: updatedTicket.updatedAt,
    };
  }
}

