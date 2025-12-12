import { Router } from 'express';
import { container } from 'tsyringe';
import { ReservationController } from '../../controllers/reservation/reservation.controller';
import { ChargePaymentController } from '../../controllers/reservation/charge_payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures reservation routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createReservationRoutesWithDI(): Router {
  const router = Router();
  const reservationController = container.resolve<ReservationController>(
    CONTROLLER_TOKENS.ReservationController
  );

  /**
   * @route   GET /api/v1/reservations
   * @desc    Get all reservations for the authenticated user
   * @access  Private
   */
  router.get('/', authenticate, (req, res) =>
    void reservationController.getReservationsList(req, res)
  );

  /**
   * @route   GET /api/v1/reservations/:id
   * @desc    Get a reservation by ID
   * @access  Private
   */
  router.get('/:id', authenticate, (req, res) =>
    void reservationController.getReservation(req, res)
  );

  // Charge payment routes
  const chargePaymentController = container.resolve<ChargePaymentController>(
    CONTROLLER_TOKENS.ChargePaymentController
  );

  /**
   * @route   POST /api/v1/reservations/:id/charges/:chargeId/payment/create-intent
   * @desc    Create payment intent for a reservation charge
   * @access  Private
   */
  router.post(
    '/:id/charges/:chargeId/payment/create-intent',
    authenticate,
    (req, res) => void chargePaymentController.createPaymentIntent(req, res)
  );

  return router;
}

