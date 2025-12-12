import { Router } from 'express';
import { container } from 'tsyringe';
import { QuoteController } from '../../controllers/quote/quote.controller';
import { PaymentController } from '../../controllers/quote/payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import {
  CreateQuoteDraftRequest,
  UpdateQuoteDraftRequest,
  CalculateRoutesRequest,
  GetRecommendationsRequest,
} from '../../../application/dtos/quote.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures quote routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createQuoteRoutesWithDI(): Router {
  const router = Router();
  const quoteController = container.resolve<QuoteController>(CONTROLLER_TOKENS.QuoteController);
  const paymentController = container.resolve<PaymentController>(CONTROLLER_TOKENS.PaymentController);

/**
 * @route   POST /api/v1/quotes
 * @desc    Create a new quote draft
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validationMiddleware(CreateQuoteDraftRequest),
  (req, res) => void quoteController.createQuoteDraft(req, res)
);

/**
 * @route   GET /api/v1/quotes
 * @desc    Get all quotes for the authenticated user
 * @access  Private
 */
router.get('/', authenticate, (req, res) => void quoteController.getQuotesList(req, res));

/**
 * @route   GET /api/v1/quotes/:id
 * @desc    Get a quote by ID
 * @access  Private
 */
router.get('/:id', authenticate, (req, res) => void quoteController.getQuote(req, res));

/**
 * @route   PUT /api/v1/quotes/:id
 * @desc    Update a quote draft
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validationMiddleware(UpdateQuoteDraftRequest),
  (req, res) => void quoteController.updateQuoteDraft(req, res)
);

/**
 * @route   DELETE /api/v1/quotes/:id
 * @desc    Delete a quote draft
 * @access  Private
 */
router.delete('/:id', authenticate, (req, res) => void quoteController.deleteQuote(req, res));

/**
 * @route   POST /api/v1/quotes/:id/calculate-routes
 * @desc    Calculate routes for a quote itinerary
 * @access  Private
 */
router.post(
  '/:id/calculate-routes',
  authenticate,
  validationMiddleware(CalculateRoutesRequest),
  (req, res) => void quoteController.calculateRoutes(req, res)
);

/**
 * @route   POST /api/v1/quotes/recommendations
 * @desc    Get vehicle recommendations based on passenger count and trip dates
 * @access  Private
 */
router.post(
  '/recommendations',
  authenticate,
  validationMiddleware(GetRecommendationsRequest),
  (req, res) => void quoteController.getVehicleRecommendations(req, res)
);

/**
 * @route   POST /api/v1/quotes/:id/calculate-pricing
 * @desc    Calculate pricing for a quote
 * @access  Private
 */
router.post(
  '/:id/calculate-pricing',
  authenticate,
  (req, res) => void quoteController.calculateQuotePricing(req, res)
);

/**
 * @route   POST /api/v1/quotes/:id/submit
 * @desc    Submit a quote (change status from draft to submitted)
 * @access  Private
 */
router.post(
  '/:id/submit',
  authenticate,
  (req, res) => void quoteController.submitQuote(req, res)
);

/**
 * @route   GET /api/v1/quotes/:id/payment
 * @desc    Get payment page data for a quote
 * @access  Private
 */
router.get(
  '/:id/payment',
  authenticate,
  (req, res) => void paymentController.getPaymentPage(req, res)
);

/**
 * @route   POST /api/v1/quotes/:id/payment/create-intent
 * @desc    Create a payment intent for a quote
 * @access  Private
 */
router.post(
  '/:id/payment/create-intent',
  authenticate,
  (req, res) => void paymentController.createPaymentIntent(req, res)
);

  return router;
}

