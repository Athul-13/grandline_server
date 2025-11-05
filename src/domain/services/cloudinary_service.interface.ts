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
}

/**
 * Options for generating signed upload parameters
 */
export interface SignedUploadOptions {
  userId: string;
  folder: string;
  maxFileSize: number;
  allowedFormats: string[];
  transformations?: CloudinaryTransformation[];
}

/**
 * Signed upload parameters returned to client
 */
export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  api_key: string;
  folder: string;
  allowed_formats: string[];
  max_file_size: number;
  transformation?: CloudinaryTransformation[];
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


