import { injectable } from 'tsyringe';
import { v2 as cloudinary } from 'cloudinary';
import {
  ICloudinaryService,
  SignedUploadOptions,
  SignedUploadParams,
} from '../../domain/services/cloudinary_service.interface';
import { CLOUDINARY_CONFIG } from '../../shared/config';
import { logger } from '../../shared/logger';
import crypto from 'crypto';

/**
 * Cloudinary service implementation
 * Handles Cloudinary operations using Cloudinary SDK
 */
@injectable()
export class CloudinaryServiceImpl implements ICloudinaryService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
      api_key: CLOUDINARY_CONFIG.API_KEY,
      api_secret: CLOUDINARY_CONFIG.API_SECRET,
    });
  }

  generateSignedUploadParams(options: SignedUploadOptions): SignedUploadParams {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Build minimal parameters to sign (only timestamp and folder)
    // Validation (size, format) happens on server after upload
    const params: Record<string, string | number> = {
      timestamp,
      folder: options.folder,
    };

    // Generate signature following Cloudinary's algorithm
    // Simple signature: only timestamp and folder
    const signatureString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&') + CLOUDINARY_CONFIG.API_SECRET;

    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex');

    return {
      timestamp,
      signature,
      api_key: CLOUDINARY_CONFIG.API_KEY,
      folder: options.folder,
    };
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      // Extract public ID from URL if full URL is provided
      const extractedPublicId = this.extractPublicIdFromUrl(publicId);

      const result = await cloudinary.uploader.destroy(extractedPublicId, {
        invalidate: true, // Invalidate CDN cache
      });

      if (result.result === 'not found') {
        logger.warn(`File not found in Cloudinary: ${extractedPublicId}`);
        // Don't throw error - file might already be deleted
      } else if (result.result !== 'ok') {
        throw new Error(`Failed to delete file from Cloudinary: ${result.result}`);
      }

      logger.info(`File deleted from Cloudinary: ${extractedPublicId}`);
    } catch (error) {
      logger.error(`Error deleting file from Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to delete file from Cloudinary');
    }
  }

  async verifyFileExists(url: string): Promise<boolean> {
    const publicId = this.extractPublicIdFromUrl(url);
    if (!publicId) {
      return false;
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      return !!result;
    } catch (error) {
      // File doesn't exist or API error
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? String(error.message)
          : JSON.stringify(error);
      
      logger.warn(`File verification failed. Public ID: ${publicId}, Error: ${errorMessage}`);
      return false;
    }
  }

  async getFileInfo(url: string): Promise<import('../../domain/services/cloudinary_service.interface').CloudinaryFileInfo | null> {
    const publicId = this.extractPublicIdFromUrl(url);
    if (!publicId) {
      return null;
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      
      return {
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? String(error.message)
          : JSON.stringify(error);
      
      logger.warn(`Failed to get file info. Public ID: ${publicId}, Error: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Extracts public ID from Cloudinary URL
   * Handles both full URLs and public IDs
   */
  private extractPublicIdFromUrl(urlOrPublicId: string): string {
    // If it's already a public ID (no http/https), return as is
    if (!urlOrPublicId.startsWith('http://') && !urlOrPublicId.startsWith('https://')) {
      return urlOrPublicId;
    }

    try {
      const url = new URL(urlOrPublicId);
      const pathParts = url.pathname.split('/');
      
      // Cloudinary URL format: /v[version]/[cloud_name]/[resource_type]/[type]/[transformations]/[public_id].[format]
      // We need to extract the public_id part
      const resourceTypeIndex = pathParts.findIndex(part => ['image', 'video', 'raw'].includes(part));
      
      if (resourceTypeIndex === -1) {
        throw new Error('Invalid Cloudinary URL format');
      }

      // Get everything after resource_type, skip type if present, skip transformations, get public_id
      const afterResourceType = pathParts.slice(resourceTypeIndex + 1);
      
      // Find the last part that contains the file extension (public_id)
      const publicIdWithExtension = afterResourceType[afterResourceType.length - 1];
      
      // Remove file extension
      const publicId = publicIdWithExtension.split('.')[0];
      
      // If there's a folder, include it
      // Filter out 'upload' and version numbers (v followed by digits)
      const folderParts = afterResourceType.slice(0, -1).filter(part => {
        if (!part) return false;
        // Exclude 'upload' type
        if (part.includes('upload')) return false;
        // Exclude version numbers (v followed by digits)
        if (/^v\d+$/.test(part)) return false;
        return true;
      });
      
      if (folderParts.length > 0) {
        return `${folderParts.join('/')}/${publicId}`;
      }
      
      return publicId;
    } catch (error) {
      logger.error(`Error extracting public ID: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback: try to extract from pathname
      const match = urlOrPublicId.match(/\/v\d+\/[^/]+\/[^/]+\/(.+)/);
      return match ? match[1].split('.')[0] : urlOrPublicId;
    }
  }
}

