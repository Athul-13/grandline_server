import { Router } from 'express';
import { container } from 'tsyringe';
import { EventTypeController } from '../../controllers/event_type/event_type.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { CreateCustomEventTypeRequest } from '../../../application/dtos/event_type.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures event type routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createEventTypeRoutesWithDI(): Router {
  const router = Router();
  const eventTypeController = container.resolve<EventTypeController>(CONTROLLER_TOKENS.EventTypeController);

/**
 * @route   GET /api/v1/event-types
 * @desc    Get all predefined event types
 * @access  Private
 */
router.get('/', authenticate, (req, res) => void eventTypeController.getEventTypes(req, res));

/**
 * @route   POST /api/v1/event-types
 * @desc    Create a custom event type
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validationMiddleware(CreateCustomEventTypeRequest),
  (req, res) => void eventTypeController.createCustomEventType(req, res)
);

  return router;
}

