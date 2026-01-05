import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { ICreateTicketUseCase } from '../../../application/use-cases/interface/support/create_ticket_use_case.interface';
import { IGetTicketsByActorUseCase } from '../../../application/use-cases/interface/support/get_ticket_by_actor_use_case.interface';
import { IGetTicketByIdUseCase } from '../../../application/use-cases/interface/support/get_ticket_by_id_use_case.interface';
import { IGetAllTicketsUseCase } from '../../../application/use-cases/interface/support/get_all_tickets_use_case.interface';
import { IUpdateTicketStatusUseCase } from '../../../application/use-cases/interface/support/update_ticket_status_use_case.interface';
import { IAssignTicketToAdminUseCase } from '../../../application/use-cases/interface/support/assign_ticket_to_admin_use_case.interface';
import {
  CreateTicketRequest,
  GetAllTicketsRequest,
  UpdateTicketStatusRequest,
  AssignTicketToAdminRequest,
} from '../../../application/dtos/ticket.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, ActorType, TicketStatus } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Ticket controller
 * Handles ticket operations
 */
@injectable()
export class TicketController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateTicketUseCase)
    private readonly createTicketUseCase: ICreateTicketUseCase,
    @inject(USE_CASE_TOKENS.GetTicketsByActorUseCase)
    private readonly getTicketsByActorUseCase: IGetTicketsByActorUseCase,
    @inject(USE_CASE_TOKENS.GetTicketByIdUseCase)
    private readonly getTicketByIdUseCase: IGetTicketByIdUseCase,
    @inject(USE_CASE_TOKENS.GetAllTicketsUseCase)
    private readonly getAllTicketsUseCase: IGetAllTicketsUseCase,
    @inject(USE_CASE_TOKENS.UpdateTicketStatusUseCase)
    private readonly updateTicketStatusUseCase: IUpdateTicketStatusUseCase,
    @inject(USE_CASE_TOKENS.AssignTicketToAdminUseCase)
    private readonly assignTicketToAdminUseCase: IAssignTicketToAdminUseCase
  ) {}

  /**
   * Handles creating a ticket
   * POST /support/tickets
   */
  async createTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Ticket creation attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as CreateTicketRequest;
      
      // Set actorId from authenticated user
      request.actorId = req.user.userId;

      logger.info(`Ticket creation request by user: ${req.user.userId} with actorType: ${request.actorType}`);

      const response = await this.createTicketUseCase.execute(request, req.user.userId);

      logger.info(`Ticket created successfully: ${response.ticketId}`);
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(`Error creating ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting tickets by actor (user/driver - only own tickets)
   * GET /support/tickets?actorType=user|driver
   */
  async getTicketsByActor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get tickets by actor attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const actorType = req.query.actorType as ActorType;
      
      if (!actorType || !Object.values(ActorType).includes(actorType)) {
        logger.warn('Get tickets by actor called without valid actorType');
        sendErrorResponse(res, new Error('actorType query parameter is required and must be "user" or "driver"'));
        return;
      }

      // Only allow USER or DRIVER actor types (not ADMIN)
      if (actorType === ActorType.ADMIN) {
        logger.warn('Get tickets by actor called with ADMIN actorType');
        sendErrorResponse(res, new Error('Invalid actorType'));
        return;
      }

      logger.info(`Get tickets by actor request: ${actorType} for user: ${req.user.userId}`);
      const response = await this.getTicketsByActorUseCase.execute(actorType, req.user.userId, req.user.userId);

      logger.info(`Retrieved ${response.tickets.length} tickets for actor: ${actorType}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting tickets by actor: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting a ticket by ID
   * GET /support/tickets/:ticketId
   */
  async getTicketById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get ticket by ID attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const { ticketId } = req.params;

      if (!ticketId) {
        logger.warn('Get ticket by ID called without ticketId');
        sendErrorResponse(res, new Error('ticketId is required'));
        return;
      }

      logger.info(`Get ticket by ID request: ${ticketId} by user: ${req.user.userId}`);
      const response = await this.getTicketByIdUseCase.execute(ticketId, req.user.userId);

      logger.info(`Ticket retrieved: ${ticketId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting ticket by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting all tickets (admin only, with filters & pagination)
   * GET /support/tickets (admin only)
   */
  async getAllTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get all tickets attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request: GetAllTicketsRequest = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status ? (req.query.status as TicketStatus) : undefined,
        actorType: req.query.actorType ? (req.query.actorType as ActorType) : undefined,
        assignedAdminId: req.query.assignedAdminId as string | undefined,
        search: req.query.search as string | undefined,
        sortBy: req.query.sortBy ? (req.query.sortBy as 'lastMessageAt' | 'createdAt') : undefined,
        sortOrder: req.query.sortOrder ? (req.query.sortOrder as 'asc' | 'desc') : undefined,
      };

      logger.info(`Get all tickets request by admin: ${req.user.userId}`);
      const response = await this.getAllTicketsUseCase.execute(request, req.user.userId);

      logger.info(`Retrieved ${response.tickets.length} tickets (page ${response.pagination.page})`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting all tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating ticket status (admin only)
   * PATCH /support/tickets/:ticketId/status
   */
  async updateTicketStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Update ticket status attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const { ticketId } = req.params;
      const request = req.body as UpdateTicketStatusRequest;

      if (!ticketId) {
        logger.warn('Update ticket status called without ticketId');
        sendErrorResponse(res, new Error('ticketId is required'));
        return;
      }

      logger.info(`Update ticket status request: ${ticketId} to ${request.status} by admin: ${req.user.userId}`);
      const response = await this.updateTicketStatusUseCase.execute(ticketId, request, req.user.userId);

      logger.info(`Ticket status updated: ${ticketId} to ${request.status}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error updating ticket status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles assigning ticket to admin (admin only)
   * PATCH /support/tickets/:ticketId/assign
   */
  async assignTicketToAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Assign ticket to admin attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const { ticketId } = req.params;
      const request = req.body as AssignTicketToAdminRequest;

      if (!ticketId) {
        logger.warn('Assign ticket to admin called without ticketId');
        sendErrorResponse(res, new Error('ticketId is required'));
        return;
      }

      logger.info(`Assign ticket to admin request: ${ticketId} to ${request.adminId} by admin: ${req.user.userId}`);
      const response = await this.assignTicketToAdminUseCase.execute(ticketId, request, req.user.userId);

      logger.info(`Ticket assigned to admin: ${ticketId} -> ${request.adminId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error assigning ticket to admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

