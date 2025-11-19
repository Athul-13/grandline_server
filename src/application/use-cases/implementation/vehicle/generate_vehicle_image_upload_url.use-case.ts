import { injectable, inject } from 'tsyringe';
import { IGenerateVehicleImageUploadUrlUseCase } from '../../interface/vehicle/generate_vehicle_image_upload_url_use_case.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { GenerateVehicleImageUploadUrlResponse } from '../../../dtos/vehicle.dto';
import { SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { CLOUDINARY_CONFIG } from '../../../../shared/config';
import { logger } from '../../../../shared/logger';

/**
 * Default upload configuration for vehicle images
 */
const VEHICLE_IMAGE_CONFIG = {
  folder: 'vehicles',
};

/**
 * Use case for generating Cloudinary signed upload URL for vehicle images
 * Generates secure, time-limited upload parameters for vehicle image uploads
 */
@injectable()
export class GenerateVehicleImageUploadUrlUseCase implements IGenerateVehicleImageUploadUrlUseCase {
  constructor(
    @inject(SERVICE_TOKENS.ICloudinaryService)
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  execute(): Promise<GenerateVehicleImageUploadUrlResponse> {
    // Generate signed upload parameters
    // Using 'vehicle' as a generic identifier since userId is required by interface
    const signedParams = this.cloudinaryService.generateSignedUploadParams({
      userId: 'vehicle',
      folder: VEHICLE_IMAGE_CONFIG.folder,
    });

    logger.info('Generated signed upload URL for vehicle image');

    return Promise.resolve({
      uploadUrl: CLOUDINARY_CONFIG.UPLOAD_URL,
      params: {
        timestamp: signedParams.timestamp,
        signature: signedParams.signature,
        api_key: signedParams.api_key,
        folder: signedParams.folder,
      },
      expiresIn: CLOUDINARY_CONFIG.SIGNED_URL_EXPIRY,
    });
  }
}

