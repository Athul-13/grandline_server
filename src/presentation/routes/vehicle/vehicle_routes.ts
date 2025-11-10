import { Router } from 'express';
import { VehicleController } from '../../controllers/vehicle/vehicle.controller';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { CreateVehicleRequest, UpdateVehicleRequest, UpdateVehicleStatusRequest } from '../../../application/dtos/vehicle.dto';

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
   * Create Vehicle
   * POST /api/v1/vehicles
   */
  router.post(
    '/',
    validationMiddleware(CreateVehicleRequest),
    (req, res) => vehicleController.createVehicle(req, res)
  );

  /**
   * Get All Vehicles
   * GET /api/v1/vehicles
   */
  router.get(
    '/',
    (req, res) => vehicleController.getAllVehicles(req, res)
  );

  /**
   * Get Vehicles by Type
   * GET /api/v1/vehicles/type/:vehicleTypeId
   * NOTE: This route must be defined BEFORE /:id to avoid route conflicts
   */
  router.get(
    '/type/:vehicleTypeId',
    (req, res) => vehicleController.getVehiclesByType(req, res)
  );

  /**
   * Get Vehicle Filter Options
   * GET /api/v1/vehicles/filter-options
   * NOTE: This route must be defined BEFORE /:id to avoid route conflicts
   */
  router.get(
    '/filter-options',
    (req, res) => vehicleController.getFilterOptions(req, res)
  );

  /**
   * Get Vehicle by ID
   * GET /api/v1/vehicles/:id
   */
  router.get(
    '/:id',
    (req, res) => vehicleController.getVehicle(req, res)
  );

  /**
   * Update Vehicle
   * PUT /api/v1/vehicles/:id
   */
  router.put(
    '/:id',
    validationMiddleware(UpdateVehicleRequest),
    (req, res) => vehicleController.updateVehicle(req, res)
  );

  /**
   * Update Vehicle Status
   * PATCH /api/v1/vehicles/:id/status
   */
  router.patch(
    '/:id/status',
    validationMiddleware(UpdateVehicleStatusRequest),
    (req, res) => vehicleController.updateVehicleStatus(req, res)
  );

  /**
   * Delete Vehicle
   * DELETE /api/v1/vehicles/:id
   */
  router.delete(
    '/:id',
    (req, res) => vehicleController.deleteVehicle(req, res)
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

