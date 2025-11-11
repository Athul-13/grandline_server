import { injectable, inject } from 'tsyringe';
import { IDeleteVehicleImagesUseCase } from '../../interface/vehicle/delete_vehicle_images_use_case.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';

/**
 * Use case for deleting vehicle images from Cloudinary
 * Handles deletion of one or multiple vehicle images
 */
@injectable()
export class DeleteVehicleImagesUseCase implements IDeleteVehicleImagesUseCase {
  constructor(
    @inject(SERVICE_TOKENS.ICloudinaryService)
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async execute(urls: string[]): Promise<void> {
    if (!urls || urls.length === 0) {
      logger.warn('Attempted to delete vehicle images with empty array');
      return;
    }

    logger.info(`Deleting ${urls.length} vehicle image(s) from Cloudinary`);

    // Delete files using Cloudinary service
    // The service handles errors gracefully and continues with other deletions
    await this.cloudinaryService.deleteFiles(urls);

    logger.info(`Successfully processed deletion request for ${urls.length} vehicle image(s)`);
  }
}

