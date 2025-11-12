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
 * Quote status enumeration
 * Tracks the current state of quotes in the system
 */
export enum QuoteStatus {
  DRAFT = 'draft',              // Quote is being built (incomplete)
  SUBMITTED = 'submitted',      // Quote is complete and submitted (awaiting admin review/payment)
  NEGOTIATING = 'negotiating',  // Quote is under negotiation
  ACCEPTED = 'accepted',        // Quote has been accepted
  REJECTED = 'rejected',        // Quote has been rejected
  PAID = 'paid',                // Quote has been paid (becomes reservation)
}

/**
 * Trip type enumeration
 * Defines the type of trip for a quote
 */
export enum TripType {
  ONE_WAY = 'one_way',          // Single direction trip
  TWO_WAY = 'two_way',          // Return trip (round trip)
}

/**
 * Stop type enumeration
 * Defines the type of stop in an itinerary
 */
export enum StopType {
  PICKUP = 'pickup',            // Pickup location
  STOP = 'stop',                // Intermediate stop
  DROPOFF = 'dropoff',          // Dropoff location
}

/**
 * Vehicle status labels mapping
 * Maps status enum values to user-friendly display labels
 */
export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  [VehicleStatus.AVAILABLE]: 'Available',
  [VehicleStatus.IN_SERVICE]: 'In Service',
  [VehicleStatus.MAINTENANCE]: 'Maintenance',
  [VehicleStatus.RETIRED]: 'Retired',
};

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
  AMENITY_CREATED: 'Amenity created successfully',
  AMENITY_UPDATED: 'Amenity updated successfully',
  AMENITY_DELETED: 'Amenity deleted successfully',
  QUOTE_DRAFT_CREATED: 'Quote draft created successfully',
  QUOTE_DRAFT_UPDATED: 'Quote draft updated successfully',
  QUOTE_SUBMITTED: 'Quote submitted successfully',
  QUOTE_DELETED: 'Quote deleted successfully',
  ROUTES_CALCULATED: 'Routes calculated successfully',
  EVENT_TYPE_CREATED: 'Event type created successfully',
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
  AMENITY_NOT_FOUND: 'Amenity not found',
  AMENITY_ALREADY_EXISTS: 'Amenity with this name already exists',
  AMENITY_IN_USE: 'Cannot delete amenity. Vehicles are using this amenity',
  INVALID_AMENITY: 'Invalid amenity',
  QUOTE_NOT_FOUND: 'Quote not found',
  QUOTE_ALREADY_SUBMITTED: 'Quote has already been submitted',
  QUOTE_CANNOT_BE_DELETED: 'Cannot delete quote. Quote has been submitted',
  INVALID_QUOTE_STATUS: 'Invalid quote status',
  INVALID_TRIP_TYPE: 'Invalid trip type',
  INVALID_STOP_TYPE: 'Invalid stop type',
  ITINERARY_REQUIRED: 'Itinerary is required',
  PASSENGERS_REQUIRED: 'At least one passenger is required',
  VEHICLES_REQUIRED: 'At least one vehicle must be selected',
  EVENT_TYPE_NOT_FOUND: 'Event type not found',
  EVENT_TYPE_ALREADY_EXISTS: 'Event type with this name already exists',
  ROUTE_CALCULATION_FAILED: 'Failed to calculate route',
  PRICING_CONFIG_NOT_FOUND: 'Pricing configuration not found',
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
  FORBIDDEN: 'FORBIDDEN',
  INVALID_QUOTE_ID: 'INVALID_QUOTE_ID',
  INVALID_USER_ID: 'INVALID_USER_ID',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_ITINERARY: 'INVALID_ITINERARY',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_VEHICLE_ID: 'INVALID_VEHICLE_ID',
  INVALID_VEHICLE_TYPE_ID: 'INVALID_VEHICLE_TYPE_ID',
  INVALID_AMENITY_ID: 'INVALID_AMENITY_ID',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_OTP: 'INVALID_OTP',
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_INVALID_STATUS: 'QUOTE_INVALID_STATUS',
  QUOTE_CANNOT_BE_DELETED: 'QUOTE_CANNOT_BE_DELETED',
  QUOTE_ALREADY_SUBMITTED: 'QUOTE_ALREADY_SUBMITTED',
  ROUTE_CALCULATION_ERROR: 'ROUTE_CALCULATION_ERROR',
  VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND',
  VEHICLE_TYPE_NOT_FOUND: 'VEHICLE_TYPE_NOT_FOUND',
  AMENITY_NOT_FOUND: 'AMENITY_NOT_FOUND',
} as const;