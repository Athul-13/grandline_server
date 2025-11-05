import { SignedUploadUrlResponse } from '../../../dtos/user.dto';

/**
 * Use case interface for generating Cloudinary signed upload URL
 */
export interface IGenerateUploadUrlUseCase {
  /**
   * Generates a signed upload URL for authenticated user
   */
  execute(userId: string): Promise<SignedUploadUrlResponse>;
}

