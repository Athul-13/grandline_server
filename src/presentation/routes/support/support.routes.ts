import { Router } from 'express';
import { container } from 'tsyringe';
import { TicketController } from '../../controllers/support/ticket.controller';
import { TicketMessageController } from '../../controllers/support/ticket_message.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import {
  CreateTicketRequest,
  GetAllTicketsRequest,
  UpdateTicketStatusRequest,
  AssignTicketToAdminRequest,
  AddMessageRequest,
  GetMessagesByTicketRequest,
} from '../../../application/dtos/ticket.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures support routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createSupportRoutesWithDI(): Router {
  const router = Router();
  const ticketController = container.resolve<TicketController>(CONTROLLER_TOKENS.TicketController);
  const ticketMessageController = container.resolve<TicketMessageController>(
    CONTROLLER_TOKENS.TicketMessageController
  );

  /**
   * @route   POST /api/v1/support/tickets
   * @desc    Create a new support ticket (user/driver)
   * @access  Private
   */
  router.post(
    '/tickets',
    authenticate,
    validationMiddleware(CreateTicketRequest),
    (req, res) => void ticketController.createTicket(req, res)
  );

  /**
   * @route   GET /api/v1/support/tickets
   * @desc    Get tickets - either by actor (user/driver) or all tickets (admin)
   * @access  Private
   * @note    If actorType query param is provided, returns tickets for that actor (user/driver only)
   *          If no actorType, requires admin role and returns all tickets with filters
   */
  router.get('/tickets', authenticate, (req, res) => {
    // Route to appropriate handler based on query params
    if (req.query.actorType) {
      return void ticketController.getTicketsByActor(req, res);
    } else {
      return void ticketController.getAllTickets(req, res);
    }
  });

  /**
   * @route   GET /api/v1/support/tickets/:ticketId
   * @desc    Get a ticket by ID (user/driver can access own ticket, admin can access any)
   * @access  Private
   */
  router.get('/tickets/:ticketId', authenticate, (req, res) => void ticketController.getTicketById(req, res));

  /**
   * @route   PATCH /api/v1/support/tickets/:ticketId/status
   * @desc    Update ticket status (admin only)
   * @access  Private (Admin)
   */
  router.patch(
    '/tickets/:ticketId/status',
    authenticate,
    requireAdmin,
    validationMiddleware(UpdateTicketStatusRequest),
    (req, res) => void ticketController.updateTicketStatus(req, res)
  );

  /**
   * @route   PATCH /api/v1/support/tickets/:ticketId/assign
   * @desc    Assign ticket to admin (admin only)
   * @access  Private (Admin)
   */
  router.patch(
    '/tickets/:ticketId/assign',
    authenticate,
    requireAdmin,
    validationMiddleware(AssignTicketToAdminRequest),
    (req, res) => void ticketController.assignTicketToAdmin(req, res)
  );

  /**
   * @route   POST /api/v1/support/tickets/:ticketId/messages
   * @desc    Add a message to a ticket
   * @access  Private
   */
  router.post(
    '/tickets/:ticketId/messages',
    authenticate,
    validationMiddleware(AddMessageRequest),
    (req, res) => void ticketMessageController.addMessageToTicket(req, res)
  );

  /**
   * @route   GET /api/v1/support/tickets/:ticketId/messages
   * @desc    Get messages for a ticket (paginated)
   * @access  Private
   */
  router.get(
    '/tickets/:ticketId/messages',
    authenticate,
    (req, res) => void ticketMessageController.getMessagesByTicket(req, res)
  );

  return router;
}

