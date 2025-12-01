import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateIf, IsEnum, IsDateString } from 'class-validator';
import { UserRole, UserStatus } from '../../shared/constants';

/**
 * Request DTO for user registration
 * Validates input data before processing
 */ 
export class RegisterUserRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/.*\S.*/, {
    message: 'Full name must contain at least one non-whitespace character',
  })
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits',
  })
  phoneNumber!: string;
}

/**
 * Request DTO for user login
 * Validates input data before processing
 */ 
export class LoginUserRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

/**
 * Request DTO for OTP verification
 * Validates input data before processing
 */ 
export class VerifyOtpRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'OTP must be exactly 6 digits',
  })
  otp!: string;
}

/**
 * Request DTO for OTP resend
 * Validates input data before processing
 */
export class ResendOtpRequest {
  @IsEmail()
  email!: string;
}

/**
 * Request DTO for forgot password
 * Validates input data before processing
 */
export class ForgotPasswordRequest {
  @IsEmail()
  email!: string;
}

/**
 * Request DTO for reset password
 * Validates input data before processing
 */
export class ResetPasswordRequest {
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
 * Request DTO for updating user profile
 * All fields are optional - only provided fields will be updated
 */
export class UpdateUserProfileRequest {
  @IsOptional()
  @ValidateIf((o: UpdateUserProfileRequest) => o.fullName !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/.*\S.*/, {
    message: 'Full name must contain at least one non-whitespace character',
  })
  fullName?: string;

  @IsOptional()
  @ValidateIf((o: UpdateUserProfileRequest) => o.phoneNumber !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits',
  })
  phoneNumber?: string;

  @IsOptional()
  @ValidateIf((o: UpdateUserProfileRequest) => o.profilePicture !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/[^/]+\/[^/]+\/.+/, {
    message: 'Profile picture must be a valid Cloudinary URL',
  })
  profilePicture?: string;
}



/**
 * Response DTO for user registration
 * Contains the result of the registration process
 */ 
export interface RegisterUserResponse {
  message: string;
  email: string;
}

/**
 * Response DTO for OTP verification
 * Contains the result of the OTP verification process
 */ 
export interface VerifyOtpResponse {
  message: string;
  email: string;
}

/**
 * Response DTO for OTP resend
 * Contains the result of the OTP resend process
 */ 
export interface ResendOtpResponse {
  message: string;
  email: string;
}

/**
 * Request DTO for refresh token
 * Contains the refresh token to generate new access token
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Response DTO for refresh token
 * Contains the new access token
 */
export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * Response DTO for user login
 * Contains the result of the login process
 */ 
export interface LoginUserResponse {
  user: {
    userId: string;
    fullName: string;
    email: string;
    role: UserRole;
    createdAt: Date;
  };
  accessToken: string; // access token
  refreshToken?: string; // refresh token
}

/**
 * Request DTO for user logout
 * Contains the refresh token extracted from HTTP-only cookie
 */
export interface LogoutUserRequest {
  refreshToken?: string; // Optional - may not exist if already logged out
}

/**
 * Response DTO for user logout
 * Contains the logout confirmation message
 */
export interface LogoutUserResponse {
  message: string;
}

/**
 * Response DTO for forgot password
 * Contains the result of the forgot password process
 */
export interface ForgotPasswordResponse {
  message: string;
  email: string;
}

/**
 * Response DTO for reset password
 * Contains the result of the reset password process
 */
export interface ResetPasswordResponse {
  message: string;
}

/**
 * Response DTO for getting user profile
 * Contains user profile information
 */
export interface GetUserProfileResponse {
  user: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    hasPassword: boolean;
    hasGoogleAuth: boolean;
  };
}

/**
 * Request DTO for listing users (admin)
 * Query parameters for filtering, searching, and pagination
 */
export interface ListUsersRequest {
  page?: number;
  limit?: number;
  status?: string[]; // Array of UserStatus values
  isVerified?: boolean;
  search?: string;
  sortBy?: string; // 'email' | 'fullName' | 'createdAt'
  sortOrder?: 'asc' | 'desc';
}

/**
 * User list item for admin view
 */
export interface UserListItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePicture: string;
  status: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for listing users (admin)
 * Contains paginated user list with metadata
 */
export interface ListUsersResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Request DTO for changing user status (admin)
 * Validates status value
 */
export class ChangeUserStatusRequest {
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status!: UserStatus;
}

/**
 * Response DTO for changing user status (admin)
 * Contains the result of the status change process
 */
export interface ChangeUserStatusResponse {
  message: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture: string;
    role: UserRole;
    status: string;
    isVerified: boolean;
    updatedAt: Date;
  };
}

/**
 * Request DTO for changing user role (admin)
 * Validates role value
 */
export class ChangeUserRoleRequest {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

/**
 * Response DTO for changing user role (admin)
 * Contains the result of the role change process
 */
export interface ChangeUserRoleResponse {
  message: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture: string;
    role: UserRole;
    status: string;
    isVerified: boolean;
    updatedAt: Date;
  };
}

/**
 * Response DTO for updating user profile
 * Contains the result of the profile update process
 */
export interface UpdateUserProfileResponse {
  message: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture: string;
    role: UserRole;
    updatedAt: Date;
  };
}

/**
 * Response DTO for generating signed upload URL
 * Contains Cloudinary upload URL and signed parameters
 */
export interface SignedUploadUrlResponse {
  uploadUrl: string;
  params: {
    timestamp: number;
    signature: string;
    api_key: string;
    folder: string;
  };
  expiresIn: number; // Expiration time in seconds
}

/**
 * Request DTO for Google authentication
 * Validates Google ID token from client
 */
export class GoogleAuthRequest {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

/**
 * Response DTO for Google authentication
 * Contains the result of Google authentication (same as login response)
 */
export interface GoogleAuthResponse {
  user: {
    userId: string;
    fullName: string;
    email: string;
    role: UserRole;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken?: string;
}

/**
 * Request DTO for setting up password
 * Validates password for Google-authenticated users
 */
export class SetupPasswordRequest {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  password!: string;
}

/**
 * Response DTO for setting up password
 * Contains the result of password setup
 */
export interface SetupPasswordResponse {
  message: string;
}

/**
 * Request DTO for linking Google account
 * Validates Google ID token for linking
 */
export class LinkGoogleRequest {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

/**
 * Response DTO for linking Google account
 * Contains the result of Google account linking
 */
export interface LinkGoogleResponse {
  message: string;
}

/**
 * Request DTO for changing password
 * Validates current and new password
 */
export class ChangePasswordRequest {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  newPassword!: string;
}

/**
 * Response DTO for changing password
 * Contains the result of password change
 */
export interface ChangePasswordResponse {
  message: string;
}

/**
 * Request DTO for getting user by ID (admin)
 * userId is extracted from route params
 */
export interface GetUserByIdRequest {
  userId: string;
}

/**
 * Response DTO for getting user by ID (admin)
 * Contains full user details for admin view
 */
export interface GetUserByIdResponse {
  user: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePicture: string;
    role: UserRole;
    status: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    hasPassword: boolean;
    hasGoogleAuth: boolean;
  };
}

/**
 * Request DTO for getting user statistics (admin)
 * Optional time range filter
 */
export class GetUserStatisticsRequest {
  @IsOptional()
  @IsEnum(['all_time', '7_days', '30_days', 'custom'])
  timeRange?: 'all_time' | '7_days' | '30_days' | 'custom';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Response DTO for user statistics (admin)
 * Contains comprehensive user analytics
 */
export interface GetUserStatisticsResponse {
  statistics: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    blockedUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    newUsers: number;
    usersByStatus: Record<string, number>;
    timeRange: {
      type: 'all_time' | '7_days' | '30_days' | 'custom';
      startDate?: Date;
      endDate?: Date;
    };
  };
}

/**
 * Request DTO for deleting user account (self-service)
 * Requires password confirmation
 */
export class DeleteUserAccountRequest {
  @IsString()
  @IsNotEmpty()
  password!: string;
}

/**
 * Response DTO for deleting user account
 * Confirms account deletion
 */
export interface DeleteUserAccountResponse {
  message: string;
}
