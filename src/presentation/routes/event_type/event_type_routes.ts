import { Router } from 'express';
import { container } from 'tsyringe';
import { EventTypeController } from '../../controllers/event_type/event_type.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { CreateCustomEventTypeRequest } from '../../../application/dtos/event_type.dto';

const router = Router();
const eventTypeController = container.resolve(EventTypeController);

/**
 * @route   GET /api/v1/event-types
 * @desc    Get all predefined event types
 * @access  Private
 */
router.get('/', authenticate, eventTypeController.getEventTypes.bind(eventTypeController));

/**
 * @route   POST /api/v1/event-types
 * @desc    Create a custom event type
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validationMiddleware(CreateCustomEventTypeRequest),
  eventTypeController.createCustomEventType.bind(eventTypeController)
);

export default router;

