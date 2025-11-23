import { Router } from 'express';
import { VehicleController } from '../../controllers/vehicle/vehicle.controller';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { CreateVehicleRequest, UpdateVehicleRequest, UpdateVehicleStatusRequest, DeleteVehicleImagesRequest } from '../../../application/dtos/vehicle.dto';

/**
 * Route configuration interface
 * Defines dependencies for route setup
 */
interface VehicleRoutesConfig {
  vehicleController: VehicleController;
}

/**
 * Creates and configures vehicle routes
 */
export function createVehicleRoutes(config: VehicleRoutesConfig): Router {
  const router = Router();
  const { vehicleController } = config;

  /**
   * Create Vehicle (Admin only)
   * POST /api/v1/vehicles
   */
  router.post(
    '/',
    authenticate,
    requireAdmin,
    validationMiddleware(CreateVehicleRequest),
    (req, res) => void vehicleController.createVehicle(req, res)
  );

  /**
   * Get All Vehicles
   * GET /api/v1/vehicles
   */
  router.get(
    '/',
    (req, res) => void vehicleController.getAllVehicles(req, res)
  );

  /**
   * Get Vehicles by Type
   * GET /api/v1/vehicles/type/:vehicleTypeId
   * NOTE: This route must be defined BEFORE /:id to avoid route conflicts
   */
  router.get(
    '/type/:vehicleTypeId',
    (req, res) => void vehicleController.getVehiclesByType(req, res)
  );

  /**
   * Get Vehicle Filter Options
   * GET /api/v1/vehicles/filter-options
   * NOTE: This route must be defined BEFORE /:id to avoid route conflicts
   */
  router.get(
    '/filter-options',
    (req, res) => void vehicleController.getFilterOptions(req, res)
  );

  /**
   * Generate Vehicle Image Upload URL (Admin only)
   * POST /api/v1/vehicles/upload-signature
   * NOTE: This route must be defined BEFORE /:id to avoid route conflicts
   */
  router.post(
    '/upload-signature',
    authenticate,
    requireAdmin,
    (req, res) => void vehicleController.generateImageUploadUrl(req, res)
  );

  /**
   * Delete Vehicle Images (Admin only)
   * DELETE /api/v1/vehicles/images
   * NOTE: This route must be defined BEFORE /:id to avoid route conflicts
   */
  router.delete(
    '/images',
    authenticate,
    requireAdmin,
    validationMiddleware(DeleteVehicleImagesRequest),
    (req, res) => void vehicleController.deleteImages(req, res)
  );

  /**
   * Get Vehicle by ID
   * GET /api/v1/vehicles/:id
   */
  router.get(
    '/:id',
    (req, res) => void vehicleController.getVehicle(req, res)
  );

  /**
   * Update Vehicle (Admin only)
   * PUT /api/v1/vehicles/:id
   */
  router.put(
    '/:id',
    authenticate,
    requireAdmin,
    validationMiddleware(UpdateVehicleRequest),
    (req, res) => void vehicleController.updateVehicle(req, res)
  );

  /**
   * Update Vehicle Status (Admin only)
   * PATCH /api/v1/vehicles/:id/status
   */
  router.patch(
    '/:id/status',
    authenticate,
    requireAdmin,
    validationMiddleware(UpdateVehicleStatusRequest),
    (req, res) => void vehicleController.updateVehicleStatus(req, res)
  );

  /**
   * Delete Vehicle (Admin only)
   * DELETE /api/v1/vehicles/:id
   */
  router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    (req, res) => void vehicleController.deleteVehicle(req, res)
  );

  return router;
}

/**
 * Factory function to create vehicle routes with DI resolution
 */
import { container } from '../../../infrastructure/di';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

export function createVehicleRoutesWithDI(): Router {
  const vehicleController = container.resolve<VehicleController>(CONTROLLER_TOKENS.VehicleController);

  return createVehicleRoutes({
    vehicleController,
  });
}

