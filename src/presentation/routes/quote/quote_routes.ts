import { Router } from 'express';
import { container } from 'tsyringe';
import { QuoteController } from '../../controllers/quote/quote.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import {
  CreateQuoteDraftRequest,
  UpdateQuoteDraftRequest,
  CalculateRoutesRequest,
} from '../../../application/dtos/quote.dto';

const router = Router();
const quoteController = container.resolve(QuoteController);

/**
 * @route   POST /api/v1/quotes
 * @desc    Create a new quote draft
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validationMiddleware(CreateQuoteDraftRequest),
  quoteController.createQuoteDraft.bind(quoteController)
);

/**
 * @route   GET /api/v1/quotes
 * @desc    Get all quotes for the authenticated user
 * @access  Private
 */
router.get('/', authenticate, quoteController.getQuotesList.bind(quoteController));

/**
 * @route   GET /api/v1/quotes/:id
 * @desc    Get a quote by ID
 * @access  Private
 */
router.get('/:id', authenticate, quoteController.getQuote.bind(quoteController));

/**
 * @route   PUT /api/v1/quotes/:id
 * @desc    Update a quote draft
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validationMiddleware(UpdateQuoteDraftRequest),
  quoteController.updateQuoteDraft.bind(quoteController)
);

/**
 * @route   DELETE /api/v1/quotes/:id
 * @desc    Delete a quote draft
 * @access  Private
 */
router.delete('/:id', authenticate, quoteController.deleteQuote.bind(quoteController));

/**
 * @route   POST /api/v1/quotes/:id/calculate-routes
 * @desc    Calculate routes for a quote itinerary
 * @access  Private
 */
router.post(
  '/:id/calculate-routes',
  authenticate,
  validationMiddleware(CalculateRoutesRequest),
  quoteController.calculateRoutes.bind(quoteController)
);

export default router;

