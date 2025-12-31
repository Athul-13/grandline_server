import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { ITicketMessageRepository } from '../../../../domain/repositories/ticket_message_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { UserRole, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { GetMessagesByTicketRequest, GetMessagesByTicketResponse } from '../../../dtos/ticket.dto';
import { IGetMessagesByTicketUseCase } from '../../interface/support/get_message_by_ticket_use_case.interface';


/**
 * Use case for getting messages by ticket ID
 * Enforces authorization and supports pagination
 */
@injectable()
export class GetMessagesByTicketUseCase implements IGetMessagesByTicketUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.ITicketRepository)
    private readonly ticketRepository: ITicketRepository,
    @inject(REPOSITORY_TOKENS.ITicketMessageRepository)
    private readonly ticketMessageRepository: ITicketMessageRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: GetMessagesByTicketRequest, requesterId: string): Promise<GetMessagesByTicketResponse> {
    // Input validation
    if (!requesterId || typeof requesterId !== 'string' || requesterId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUESTER_ID', 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    if (!request.ticketId || typeof request.ticketId !== 'string' || request.ticketId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_TICKET_ID', 400);
    }

    // Validate pagination parameters
    const page = request.page || 1;
    const limit = request.limit || 50;

    if (page < 1) {
      throw new AppError('Page must be greater than 0', 'INVALID_PAGE', 400);
    }

    if (limit < 1 || limit > 100) {
      throw new AppError('Limit must be between 1 and 100', 'INVALID_LIMIT', 400);
    }

    // Get ticket for authorization check
    const ticket = await this.ticketRepository.findById(request.ticketId);

    if (!ticket) {
      logger.warn(`Attempt to get messages from non-existent ticket: ${request.ticketId}`);
      throw new AppError('Ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    // Check if requester is admin
    const requesterUser = await this.userRepository.findById(requesterId);
    const isAdmin = requesterUser?.role === UserRole.ADMIN;

    // Authorization: Non-admins can only access their own tickets
    if (!isAdmin && !ticket.isActor(requesterId)) {
      logger.warn(`User ${requesterId} attempted to get messages from ticket ${request.ticketId} without permission`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Get all messages for total count
    const allMessages = await this.ticketMessageRepository.findByTicketId(request.ticketId);

    // Get paginated messages
    const messages = await this.ticketMessageRepository.findByTicketIdPaginated(request.ticketId, page, limit);

    // Convert to response format
    const messageResponses = messages.map((message) => ({
      messageId: message.messageId,
      ticketId: message.ticketId,
      senderType: message.senderType,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    }));

    return {
      messages: messageResponses,
      total: allMessages.length,
      page,
      limit,
      hasMore: page * limit < allMessages.length,
    };
  }
}

