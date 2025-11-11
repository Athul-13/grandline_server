import { Router } from 'express';
import { AmenityController } from '../../controllers/amenity/amenity.controller';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { CreateAmenityRequest, UpdateAmenityRequest } from '../../../application/dtos/amenity.dto';

/**
 * Route configuration interface
 * Defines dependencies for route setup
 */
interface AmenityRoutesConfig {
  amenityController: AmenityController;
}

/**
 * Creates and configures amenity routes
 */
export function createAmenityRoutes(config: AmenityRoutesConfig): Router {
  const router = Router();
  const { amenityController } = config;

  /**
   * Create Amenity (Admin only)
   * POST /api/v1/amenities
   */
  router.post(
    '/',
    authenticate,
    authorize(['admin']),
    validationMiddleware(CreateAmenityRequest),
    (req, res) => amenityController.createAmenity(req, res)
  );

  /**
   * Get All Amenities
   * GET /api/v1/amenities
   */
  router.get(
    '/',
    (req, res) => amenityController.getAllAmenities(req, res)
  );

  /**
   * Get Paid Amenities (for reservations)
   * GET /api/v1/amenities/paid
   * NOTE: This route must be defined BEFORE /:id to avoid route conflicts
   */
  router.get(
    '/paid',
    (req, res) => amenityController.getPaidAmenities(req, res)
  );

  /**
   * Get Amenity by ID
   * GET /api/v1/amenities/:id
   */
  router.get(
    '/:id',
    (req, res) => amenityController.getAmenity(req, res)
  );

  /**
   * Update Amenity (Admin only)
   * PUT /api/v1/amenities/:id
   */
  router.put(
    '/:id',
    authenticate,
    authorize(['admin']),
    validationMiddleware(UpdateAmenityRequest),
    (req, res) => amenityController.updateAmenity(req, res)
  );

  /**
   * Delete Amenity (Admin only)
   * DELETE /api/v1/amenities/:id
   */
  router.delete(
    '/:id',
    authenticate,
    authorize(['admin']),
    (req, res) => amenityController.deleteAmenity(req, res)
  );

  return router;
}

/**
 * Factory function to create amenity routes with DI resolution
 */
import { container } from '../../../infrastructure/di';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

export function createAmenityRoutesWithDI(): Router {
  const amenityController = container.resolve<AmenityController>(CONTROLLER_TOKENS.AmenityController);

  return createAmenityRoutes({
    amenityController,
  });
}

