import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateIf, IsEnum, IsNumber, Min } from 'class-validator';
import { DriverStatus } from '../../shared/constants';

/**
 * Request DTO for creating a driver (admin)
 * Validates input data before processing
 */
export class CreateDriverRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @Matches(/.*\S.*/, {
    message: 'Full name must contain at least one non-whitespace character',
  })
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits',
  })
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber!: string;

  @IsNumber()
  @Min(0)
  salary!: number;
}

/**
 * Response DTO for creating a driver (admin)
 * Contains driver details and plain password (only returned at creation)
 */
export interface CreateDriverResponse {
  driver: {
    driverId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    licenseNumber: string;
    status: DriverStatus;
    salary: number;
    isOnboarded: boolean;
    createdAt: Date;
  };
  password: string; // Plain password - only returned at creation
}

/**
 * Request DTO for updating a driver (admin)
 * All fields are optional - only provided fields will be updated
 */
export class UpdateDriverRequest {
  @IsOptional()
  @ValidateIf((o: UpdateDriverRequest) => o.fullName !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @Matches(/.*\S.*/, {
    message: 'Full name must contain at least one non-whitespace character',
  })
  fullName?: string;

  @IsOptional()
  @ValidateIf((o: UpdateDriverRequest) => o.email !== undefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateIf((o: UpdateDriverRequest) => o.phoneNumber !== undefined)
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits',
  })
  phoneNumber?: string;

  @IsOptional()
  @ValidateIf((o: UpdateDriverRequest) => o.licenseNumber !== undefined)
  @IsString()
  @IsNotEmpty()
  licenseNumber?: string;

  @IsOptional()
  @ValidateIf((o: UpdateDriverRequest) => o.salary !== undefined)
  @IsNumber()
  @Min(0)
  salary?: number;
}

/**
 * Response DTO for updating a driver (admin)
 */
export interface UpdateDriverResponse {
  message: string;
  driver: {
    driverId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    licenseNumber: string;
    status: DriverStatus;
    salary: number;
    isOnboarded: boolean;
    updatedAt: Date;
  };
}

/**
 * Request DTO for updating driver status (admin)
 * Validates status value
 */
export class UpdateDriverStatusRequest {
  @IsEnum(DriverStatus)
  @IsNotEmpty()
  status!: DriverStatus;
}

/**
 * Response DTO for updating driver status (admin)
 */
export interface UpdateDriverStatusResponse {
  message: string;
  driver: {
    driverId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    licenseNumber: string;
    status: DriverStatus;
    isOnboarded: boolean;
    updatedAt: Date;
  };
}

/**
 * Request DTO for updating driver salary (admin)
 */
export class UpdateDriverSalaryRequest {
  @IsNumber()
  @Min(0)
  salary!: number;
}

/**
 * Response DTO for updating driver salary (admin)
 */
export interface UpdateDriverSalaryResponse {
  message: string;
  driver: {
    driverId: string;
    fullName: string;
    email: string;
    salary: number;
    updatedAt: Date;
  };
}

/**
 * Request DTO for listing drivers (admin)
 * Query parameters for filtering, searching, and pagination
 */
export interface ListDriversRequest {
  page?: number;
  limit?: number;
  status?: string[]; // Array of DriverStatus values
  isOnboarded?: boolean;
  search?: string;
  sortBy?: string; // 'email' | 'fullName' | 'licenseNumber' | 'createdAt'
  sortOrder?: 'asc' | 'desc';
}

/**
 * Driver list item for admin view
 */
export interface DriverListItem {
  driverId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  licenseNumber: string;
  profilePictureUrl: string;
  licenseCardPhotoUrl: string;
  status: DriverStatus;
  salary: number;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for listing drivers (admin)
 * Contains paginated driver list with metadata
 */
export interface ListDriversResponse {
  drivers: DriverListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response DTO for getting driver by ID (admin)
 */
export interface GetDriverByIdResponse {
  driver: {
    driverId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    licenseNumber: string;
    profilePictureUrl: string;
    licenseCardPhotoUrl: string;
    status: DriverStatus;
    salary: number;
    isOnboarded: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Request DTO for driver statistics (admin)
 */
export interface GetDriverStatisticsRequest {
  timeRange?: 'all_time' | '7_days' | '30_days' | 'custom';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Response DTO for driver statistics (admin)
 */
export interface GetDriverStatisticsResponse {
  statistics: {
    totalDrivers: number;
    availableDrivers: number;
    offlineDrivers: number;
    onTripDrivers: number;
    suspendedDrivers: number;
    blockedDrivers: number;
    onboardedDrivers: number;
    notOnboardedDrivers: number;
    newDrivers: number;
    driversByStatus: Record<string, number>;
    timeRange?: {
      type: 'all_time' | '7_days' | '30_days' | 'custom';
      startDate?: Date | string;
      endDate?: Date | string;
    };
  };
}

// ==================== Driver (Mobile App) DTOs ====================

/**
 * Request DTO for driver login
 * Validates input data before processing
 */
export class LoginDriverRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

/**
 * Response DTO for driver login
 * Contains driver info and JWT tokens
 */
export interface LoginDriverResponse {
  driver: {
    driverId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    licenseNumber: string;
    profilePictureUrl: string;
    licenseCardPhotoUrl: string;
    status: DriverStatus;
    salary: number;
    isOnboarded: boolean;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken?: string;
}

/**
 * Request DTO for changing driver password
 */
export class ChangeDriverPasswordRequest {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  newPassword!: string;
}

/**
 * Response DTO for changing driver password
 */
export interface ChangeDriverPasswordResponse {
  message: string;
}

/**
 * Response DTO for getting driver profile
 * Contains driver profile information with onboarding progress
 */
export interface GetDriverProfileResponse {
  driver: {
    driverId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    licenseNumber: string;
    profilePictureUrl: string;
    licenseCardPhotoUrl: string;
    status: DriverStatus;
    salary: number;
    isOnboarded: boolean;
    onboardingProgress: {
      profilePictureUploaded: boolean;
      licenseCardUploaded: boolean;
      isComplete: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Request DTO for updating profile picture (driver onboarding)
 */
export class UpdateProfilePictureRequest {
  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/[^/]+\/[^/]+\/.+/, {
    message: 'Profile picture must be a valid Cloudinary URL',
  })
  profilePictureUrl!: string;
}

/**
 * Response DTO for updating profile picture
 */
export interface UpdateProfilePictureResponse {
  message: string;
  driver: {
    driverId: string;
    profilePictureUrl: string;
    isOnboarded: boolean;
    updatedAt: Date;
  };
}

/**
 * Request DTO for updating license card photo (driver onboarding)
 */
export class UpdateLicenseCardPhotoRequest {
  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/[^/]+\/[^/]+\/.+/, {
    message: 'License card photo must be a valid Cloudinary URL',
  })
  licenseCardPhotoUrl!: string;
}

/**
 * Response DTO for updating license card photo
 */
export interface UpdateLicenseCardPhotoResponse {
  message: string;
  driver: {
    driverId: string;
    licenseCardPhotoUrl: string;
    isOnboarded: boolean;
    updatedAt: Date;
  };
}

/**
 * Request DTO for updating password during onboarding (optional)
 */
export class UpdateOnboardingPasswordRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  newPassword!: string;
}

/**
 * Response DTO for updating onboarding password
 */
export interface UpdateOnboardingPasswordResponse {
  message: string;
}

/**
 * Request DTO for completing driver onboarding
 */
export class CompleteOnboardingRequest {
  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/[^/]+\/[^/]+\/.+/, {
    message: 'Driver license must be a valid Cloudinary URL',
  })
  driverLicense!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/[^/]+\/[^/]+\/.+/, {
    message: 'Profile picture must be a valid Cloudinary URL',
  })
  profilePicture!: string;
}

/**
 * Response DTO for completing driver onboarding
 */
export interface CompleteOnboardingResponse {
  isOnboardingComplete: boolean;
}

/**
 * Response DTO for getting driver info
 */
export interface GetDriverInfoResponse {
  hasLicense: boolean;
  hasProfilePicture: boolean;
}

/**
 * Request DTO for driver forgot password
 * Validates input data before processing
 */
export class ForgotDriverPasswordRequest {
  @IsEmail()
  email!: string;
}

/**
 * Response DTO for driver forgot password
 * Contains the result of the forgot password process
 */
export interface ForgotDriverPasswordResponse {
  message: string;
  email: string;
}

/**
 * Request DTO for driver reset password
 * Validates input data before processing
 */
export class ResetDriverPasswordRequest {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  newPassword!: string;
}

/**
 * Response DTO for driver reset password
 * Contains the result of the reset password process
 */
export interface ResetDriverPasswordResponse {
  message: string;
}

