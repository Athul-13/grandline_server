import { Router } from 'express';
import { VehicleTypeController } from '../../controllers/vehicle_type/vehicle_type.controller';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { CreateVehicleTypeRequest, UpdateVehicleTypeRequest } from '../../../application/dtos/vehicle.dto';

/**
 * Route configuration interface
 * Defines dependencies for route setup
 */
interface VehicleTypeRoutesConfig {
  vehicleTypeController: VehicleTypeController;
}

/**
 * Creates and configures vehicle type routes
 */
export function createVehicleTypeRoutes(config: VehicleTypeRoutesConfig): Router {
  const router = Router();
  const { vehicleTypeController } = config;

  /**
   * Create Vehicle Type (Admin only)
   * POST /api/v1/vehicle-types
   */
  router.post(
    '/',
    authenticate,
    authorize(['admin']),
    validationMiddleware(CreateVehicleTypeRequest),
    (req, res) => void vehicleTypeController.createVehicleType(req, res)
  );

  /**
   * Get All Vehicle Types
   * GET /api/v1/vehicle-types
   */
  router.get(
    '/',
    (req, res) => void vehicleTypeController.getAllVehicleTypes(req, res)
  );

  /**
   * Get Vehicle Type by ID
   * GET /api/v1/vehicle-types/:id
   */
  router.get(
    '/:id',
    (req, res) => void vehicleTypeController.getVehicleType(req, res)
  );

  /**
   * Update Vehicle Type (Admin only)
   * PUT /api/v1/vehicle-types/:id
   */
  router.put(
    '/:id',
    authenticate,
    authorize(['admin']),
    validationMiddleware(UpdateVehicleTypeRequest),
    (req, res) => void vehicleTypeController.updateVehicleType(req, res)
  );

  /**
   * Delete Vehicle Type (Admin only)
   * DELETE /api/v1/vehicle-types/:id
   */
  router.delete(
    '/:id',
    authenticate,
    authorize(['admin']),
    (req, res) => void vehicleTypeController.deleteVehicleType(req, res)
  );

  return router;
}

/**
 * Factory function to create vehicle type routes with DI resolution
 */
import { container } from '../../../infrastructure/di';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

export function createVehicleTypeRoutesWithDI(): Router {
  const vehicleTypeController = container.resolve<VehicleTypeController>(CONTROLLER_TOKENS.VehicleTypeController);

  return createVehicleTypeRoutes({
    vehicleTypeController,
  });
}

