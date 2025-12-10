import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminReservationController } from '../../controllers/admin/admin_reservation.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import {
  UpdateReservationStatusRequest,
  AddPassengersToReservationRequest,
  ChangeReservationDriverRequest,
  AdjustReservationVehiclesRequest,
  UpdateReservationItineraryRequest,
  ProcessReservationRefundRequest,
  CancelReservationRequest,
  AddReservationChargeRequest,
} from '../../../application/dtos/admin_reservation.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures admin reservation routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createAdminReservationRoutesWithDI(): Router {
  const router = Router();
  const adminReservationController = container.resolve<AdminReservationController>(
    CONTROLLER_TOKENS.AdminReservationController
  );

  /**
   * @route   GET /api/v1/admin/reservations
   * @desc    Get all reservations with filtering, sorting, and pagination (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/',
    authenticate,
    requireAdmin,
    (req, res) => void adminReservationController.getReservationsList(req, res)
  );

  /**
   * @route   GET /api/v1/admin/reservations/:id
   * @desc    Get reservation details by ID (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/:id',
    authenticate,
    requireAdmin,
    (req, res) => void adminReservationController.getReservation(req, res)
  );

  /**
   * @route   PUT /api/v1/admin/reservations/:id/status
   * @desc    Update reservation status (admin only)
   * @access  Private (Admin)
   */
  router.put(
    '/:id/status',
    authenticate,
    requireAdmin,
    validationMiddleware(UpdateReservationStatusRequest),
    (req, res) => void adminReservationController.updateReservationStatus(req, res)
  );

  /**
   * @route   POST /api/v1/admin/reservations/:id/passengers
   * @desc    Add passengers to reservation (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/:id/passengers',
    authenticate,
    requireAdmin,
    validationMiddleware(AddPassengersToReservationRequest),
    (req, res) => void adminReservationController.addPassengers(req, res)
  );

  /**
   * @route   POST /api/v1/admin/reservations/:id/change-driver
   * @desc    Change driver for reservation (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/:id/change-driver',
    authenticate,
    requireAdmin,
    validationMiddleware(ChangeReservationDriverRequest),
    (req, res) => void adminReservationController.changeDriver(req, res)
  );

  /**
   * @route   POST /api/v1/admin/reservations/:id/adjust-vehicles
   * @desc    Adjust vehicles for reservation (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/:id/adjust-vehicles',
    authenticate,
    requireAdmin,
    validationMiddleware(AdjustReservationVehiclesRequest),
    (req, res) => void adminReservationController.adjustVehicles(req, res)
  );

  /**
   * @route   PUT /api/v1/admin/reservations/:id/itinerary
   * @desc    Update itinerary for reservation (admin only)
   * @access  Private (Admin)
   */
  router.put(
    '/:id/itinerary',
    authenticate,
    requireAdmin,
    validationMiddleware(UpdateReservationItineraryRequest),
    (req, res) => void adminReservationController.updateItinerary(req, res)
  );

  /**
   * @route   POST /api/v1/admin/reservations/:id/refund
   * @desc    Process refund for reservation (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/:id/refund',
    authenticate,
    requireAdmin,
    validationMiddleware(ProcessReservationRefundRequest),
    (req, res) => void adminReservationController.processRefund(req, res)
  );

  /**
   * @route   POST /api/v1/admin/reservations/:id/cancel
   * @desc    Cancel reservation (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/:id/cancel',
    authenticate,
    requireAdmin,
    validationMiddleware(CancelReservationRequest),
    (req, res) => void adminReservationController.cancelReservation(req, res)
  );

  /**
   * @route   POST /api/v1/admin/reservations/:id/charges
   * @desc    Add charge to reservation (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/:id/charges',
    authenticate,
    requireAdmin,
    validationMiddleware(AddReservationChargeRequest),
    (req, res) => void adminReservationController.addCharge(req, res)
  );

  return router;
}

