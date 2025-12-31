import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { Ticket } from '../../../../domain/entities/ticket.entity';
import { UserRole, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { GetTicketByIdResponse } from '../../../dtos/ticket.dto';
import { IAssignTicketToAdminUseCase, AssignTicketToAdminRequest } from '../../interface/support/assign_ticket_to_admin_use_case.interface';

/**
 * Use case for assigning ticket to admin
 * Admin only - validates admin exists
 */
@injectable()
export class AssignTicketToAdminUseCase implements IAssignTicketToAdminUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.ITicketRepository)
    private readonly ticketRepository: ITicketRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async execute(
    ticketId: string,
    request: AssignTicketToAdminRequest,
    requesterId: string
  ): Promise<GetTicketByIdResponse> {
    // Input validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_TICKET_ID', 400);
    }

    if (!requesterId || typeof requesterId !== 'string' || requesterId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUESTER_ID', 400);
    }

    if (!request || !request.adminId) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    if (typeof request.adminId !== 'string' || request.adminId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_ADMIN_ID', 400);
    }

    // Authorization: Only admins can assign tickets
    const requesterUser = await this.userRepository.findById(requesterId);
    if (!requesterUser || requesterUser.role !== UserRole.ADMIN) {
      logger.warn(`Non-admin user ${requesterId} attempted to assign ticket to admin`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Validate that assigned admin exists and is an admin
    const assignedAdmin = await this.userRepository.findById(request.adminId);
    if (!assignedAdmin) {
      logger.warn(`Attempt to assign ticket to non-existent admin: ${request.adminId}`);
      throw new AppError('Admin not found', 'ADMIN_NOT_FOUND', 404);
    }

    if (assignedAdmin.role !== UserRole.ADMIN) {
      logger.warn(`Attempt to assign ticket to user who is not an admin: ${request.adminId}`);
      throw new AppError('User is not an admin', 'NOT_AN_ADMIN', 400);
    }

    // Get ticket
    const ticket = await this.ticketRepository.findById(ticketId);

    if (!ticket) {
      logger.warn(`Attempt to assign non-existent ticket: ${ticketId}`);
      throw new AppError('Ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    // Update ticket assignedAdminId
    await this.ticketRepository.updateById(ticketId, {
      assignedAdminId: request.adminId,
    } as Partial<Ticket>);

    // Fetch updated ticket
    const updatedTicket = await this.ticketRepository.findById(ticketId);
    if (!updatedTicket) {
      throw new AppError('Ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    logger.info(`Ticket assigned to admin: ${ticketId} -> ${request.adminId} by admin: ${requesterId}`);

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
      assignedAdminId: updatedTicket.assignedAdminId,
      lastMessageAt: updatedTicket.lastMessageAt,
      createdAt: updatedTicket.createdAt,
      updatedAt: updatedTicket.updatedAt,
    };
  }
}

