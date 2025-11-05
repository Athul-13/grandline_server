/**
 * Cloudinary service interface
 * Handles Cloudinary operations for file uploads and management
 */
export interface ICloudinaryService {
  /**
   * Generates signed upload parameters for secure direct uploads
   * Supports different upload types via options (profile, vehicle, etc.)
   */
  generateSignedUploadParams(options: SignedUploadOptions): SignedUploadParams;

  /**
   * Deletes a file from Cloudinary
   */
  deleteFile(publicIdOrUrl: string): Promise<void>;

  /**
   * Verifies if a file exists in Cloudinary
   */
  verifyFileExists(url: string): Promise<boolean>;

  /**
   * Gets file information from Cloudinary (size, format, dimensions)
   */
  getFileInfo(url: string): Promise<CloudinaryFileInfo | null>;
}

/**
 * Cloudinary file information for validation
 */
export interface CloudinaryFileInfo {
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Options for generating signed upload parameters
 * Simplified: only folder is needed for signing
 * Validation (size, format) happens on server after upload
 */
export interface SignedUploadOptions {
  userId: string;
  folder: string;
}

/**
 * Signed upload parameters returned to client
 * Simplified: only essential parameters for signed upload
 */
export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  api_key: string;
  folder: string;
}

/**
 * Cloudinary transformation options
 */
export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: string;
  format?: string;
}


