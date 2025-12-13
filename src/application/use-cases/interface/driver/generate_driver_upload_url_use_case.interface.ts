import { SignedUploadUrlResponse } from '../../../dtos/user.dto';

/**
 * Use case interface for generating Cloudinary signed upload URL for drivers
 */
export interface IGenerateDriverUploadUrlUseCase {
  /**
   * Generates a signed upload URL for authenticated driver
   */
  execute(driverId: string): Promise<SignedUploadUrlResponse>;
}

