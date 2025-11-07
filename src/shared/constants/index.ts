/**
 * User role enumeration
 * Defines available user roles in the bus rental system
 */
export enum UserRole {
  ADMIN = 'admin',  
  USER = 'user'     
}

/**
 * User status enumeration
 * Tracks the current state of user accounts
 */
export enum UserStatus {
  ACTIVE = 'active',    
  INACTIVE = 'inactive', 
}

/**
 * Driver status enumeration
 * Tracks the current state of driver accounts
 */
export enum DriverStatus {
  AVAILABLE = 'available',  
  ON_TRIP = 'ontrip',       
  OFFLINE = 'offline',      
  SUSPENDED = 'suspended', 
  BLOCKED = 'blocked'       
}

/**
 * Vehicle status enumeration
 * Tracks the current state of vehicles in the system
 */
export enum VehicleStatus {
  AVAILABLE = 'available',      // Ready for rental
  IN_SERVICE = 'in_service',    // Currently on a trip/rented
  MAINTENANCE = 'maintenance',  // Under repair/maintenance
  RETIRED = 'retired',          // No longer in service
}

/**
 * OTP configuration constants
 * Manages one-time password generation and expiry
 */
export const OTP_CONFIG = {
  LENGTH: 6,                    // OTP is 6 digits
  EXPIRY_TIME: 120000,          // 2 minutes in milliseconds
  REDIS_PREFIX: 'otp:',        
} as const;

/**
 * Token blacklist constants
 */
export const TOKEN_BLACKLIST = {
  PREFIX: 'blacklist:',
} as const;

/**
 * Cookie configuration constants
 * Names for HTTP-only cookies storing authentication tokens
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

/**
 * HTTP status codes used across the application
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Centralized human-readable success and error messages
 */
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully. Please verify using OTP',
  OTP_SENT: 'OTP has been sent',
  OTP_VERIFIED: 'OTP verified successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET_EMAIL_SENT: 'Password reset link has been sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
  PASSWORD_CHANGED_SUCCESS: 'Password changed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  GOOGLE_AUTH_SUCCESS: 'Google authentication successful',
  PASSWORD_SETUP_SUCCESS: 'Password has been set successfully',
  GOOGLE_ACCOUNT_LINKED: 'Google account linked successfully',
  VEHICLE_TYPE_CREATED: 'Vehicle type created successfully',
  VEHICLE_TYPE_UPDATED: 'Vehicle type updated successfully',
  VEHICLE_TYPE_DELETED: 'Vehicle type deleted successfully',
  VEHICLE_CREATED: 'Vehicle created successfully',
  VEHICLE_UPDATED: 'Vehicle updated successfully',
  VEHICLE_STATUS_UPDATED: 'Vehicle status updated successfully',
  VEHICLE_DELETED: 'Vehicle deleted successfully',
} as const;

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_NOT_VERIFIED: 'Please verify your account to continue',
  OTP_INVALID_OR_EXPIRED: 'OTP is invalid or has expired',
  TOKEN_REVOKED: 'Token has been revoked',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_RESET_TOKEN: 'Invalid or expired password reset token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'You do not have permission to perform this action',
  BAD_REQUEST: 'Invalid request data',
  SERVER_ERROR: 'Something went wrong. Please try again later',
  ACCOUNT_ALREADY_EXISTS: 'Account already exists',
  ACCOUNT_EXISTS_WITH_EMAIL: 'Account already exists with this email. Please use another email',
  GOOGLE_ACCOUNT_ALREADY_LINKED: 'Google account already linked',
  GOOGLE_EMAIL_MISMATCH: 'Email mismatch. Google account email must match your account email',
  INVALID_GOOGLE_TOKEN: 'Invalid Google token',
  VEHICLE_TYPE_NOT_FOUND: 'Vehicle type not found',
  VEHICLE_TYPE_ALREADY_EXISTS: 'Vehicle type with this name already exists',
  VEHICLE_TYPE_IN_USE: 'Cannot delete vehicle type. Vehicles are using this type',
  VEHICLE_NOT_FOUND: 'Vehicle not found',
  VEHICLE_PLATE_NUMBER_EXISTS: 'Vehicle with this plate number already exists',
  VEHICLE_IN_USE: 'Cannot delete vehicle. Vehicle is currently in use',
  INVALID_VEHICLE_TYPE: 'Invalid vehicle type',
} as const;

/**
 * Application-specific machine-readable error codes (useful for i18n/logging)
 */
export const ERROR_CODES = {
  AUTH_INVALID_OTP: 'AUTH_INVALID_OTP',
  AUTH_ACCOUNT_BLOCKED: 'AUTH_ACCOUNT_BLOCKED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  USER_DUPLICATE_EMAIL: 'USER_DUPLICATE_EMAIL',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const;