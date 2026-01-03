import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { IAddMessageUseCase } from '../../../application/use-cases/interface/support/add_message_use_case.interface';
import { IGetMessagesByTicketUseCase } from '../../../application/use-cases/interface/support/get_message_by_ticket_use_case.interface';
import { AddMessageRequest, GetMessagesByTicketRequest } from '../../../application/dtos/ticket.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Ticket message controller
 * Handles ticket message operations
 */
@injectable()
export class TicketMessageController {
  constructor(
    @inject(USE_CASE_TOKENS.AddMessageUseCase)
    private readonly addMessageUseCase: IAddMessageUseCase,
    @inject(USE_CASE_TOKENS.GetMessagesByTicketUseCase)
    private readonly getMessagesByTicketUseCase: IGetMessagesByTicketUseCase
  ) {}

  /**
   * Handles adding a message to a ticket
   * POST /support/tickets/:ticketId/messages
   */
  async addMessageToTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Add message to ticket attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const { ticketId } = req.params;
      const request = req.body as AddMessageRequest;

      if (!ticketId) {
        logger.warn('Add message called without ticketId');
        sendErrorResponse(res, new Error('ticketId is required'));
        return;
      }

      // Set ticketId from URL parameter
      request.ticketId = ticketId;

      logger.info(`Add message to ticket request: ${ticketId} by user: ${req.user.userId}`);
      const response = await this.addMessageUseCase.execute(request, req.user.userId);

      logger.info(`Message added successfully: ${response.messageId} to ticket: ${ticketId}`);
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(`Error adding message to ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting messages by ticket ID (paginated)
   * GET /support/tickets/:ticketId/messages
   */
  async getMessagesByTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get messages by ticket attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const { ticketId } = req.params;

      if (!ticketId) {
        logger.warn('Get messages by ticket called without ticketId');
        sendErrorResponse(res, new Error('ticketId is required'));
        return;
      }

      const request: GetMessagesByTicketRequest = {
        ticketId,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      logger.info(`Get messages by ticket request: ${ticketId} by user: ${req.user.userId}`);
      const response = await this.getMessagesByTicketUseCase.execute(request, req.user.userId);

      logger.info(`Retrieved ${response.messages.length} messages for ticket: ${ticketId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting messages by ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

