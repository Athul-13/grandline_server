/**
 * Expo Push Notification API endpoint
 */
export const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

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
  INACTIVE = 'inactive', // User self-deleted (can re-register)
  BLOCKED = 'blocked',   // Admin blocked (can login but restricted)
  DELETED = 'deleted',   // Admin deactivated (cannot re-register)
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
  QUOTED = 'quoted',            // Quote has been quoted with actual driver pricing
}

/**
 * Reservation status enumeration
 * Tracks the current state of reservations in the system
 */
export enum ReservationStatus {
  CONFIRMED = 'confirmed',      // Reservation confirmed (just created, no modifications)
  MODIFIED = 'modified',        // Reservation has been modified from original
  CANCELLED = 'cancelled',       // Reservation cancelled by user/admin
  COMPLETED = 'completed',      // Trip completed
  REFUNDED = 'refunded',        // Fully refunded
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
 * Chat participant type enumeration
 * Defines the type of chat conversation based on participants
 */
export enum ParticipantType {
  ADMIN_USER = 'admin_user',        // Chat between admin and user
  ADMIN_DRIVER = 'admin_driver',    // Chat between admin and driver
  DRIVER_USER = 'driver_user',      // Chat between driver and user
}

/**
 * Message delivery status enumeration
 * Tracks the delivery and read status of messages
 */
export enum MessageDeliveryStatus {
  SENT = 'sent',                // Message saved to database
  DELIVERED = 'delivered',      // Recipient is online (socket connected)
  READ = 'read',                // Recipient actively viewing chat
}

/**
 * Notification type enumeration
 * Defines the type of notification in the system
 */
export enum NotificationType {
  CHAT_MESSAGE = 'chat_message',   // New chat message notification
  RESERVATION_CONFIRMED = 'reservation_confirmed',   // Reservation confirmed (created after payment)
  RESERVATION_MODIFIED = 'reservation_modified',   // Reservation has been modified
  RESERVATION_DRIVER_CHANGED = 'reservation_driver_changed',   // Driver changed for reservation
  RESERVATION_PASSENGERS_ADDED = 'reservation_passengers_added',   // Passengers added to reservation
  RESERVATION_VEHICLES_ADJUSTED = 'reservation_vehicles_adjusted',   // Vehicles adjusted for reservation
  ITINERARY_UPDATED = 'itinerary_updated',   // Itinerary updated for reservation
  RESERVATION_STATUS_CHANGED = 'reservation_status_changed',   // Reservation status changed
  RESERVATION_CHARGE_ADDED = 'reservation_charge_added',   // Additional charge added to reservation
  RESERVATION_CANCELLED = 'reservation_cancelled',   // Reservation cancelled
  RESERVATION_REFUNDED = 'reservation_refunded',   // Reservation refund processed
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
  USER_STATUS_UPDATED: 'User status updated successfully',
  USER_ROLE_UPDATED: 'User role updated successfully',
  USER_DELETED: 'User deleted successfully',
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
  DRIVER_CREATED: 'Driver created successfully',
  DRIVER_UPDATED: 'Driver updated successfully',
  DRIVER_STATUS_UPDATED: 'Driver status updated successfully',
  DRIVER_SALARY_UPDATED: 'Driver salary updated successfully',
  DRIVER_DELETED: 'Driver deleted successfully',
  DRIVER_PROFILE_PICTURE_UPDATED: 'Profile picture updated successfully',
  DRIVER_LICENSE_CARD_UPDATED: 'License card photo updated successfully',
  DRIVER_ONBOARDING_PASSWORD_UPDATED: 'Password updated successfully',
  DRIVER_PASSWORD_CHANGED: 'Password changed successfully',
  DRIVER_LOGIN_SUCCESS: 'Login successful',
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
  NO_ADMIN_AVAILABLE: 'No admin available to assign to chat',
  INVALID_USER_STATUS: 'Invalid user status',
  CANNOT_BLOCK_ADMIN: 'Cannot block admin user',
  CANNOT_DELETE_ADMIN: 'Cannot delete admin user',
  INVALID_USER_ROLE: 'Invalid user role',
  DRIVER_NOT_FOUND: 'Driver not found',
  DRIVER_EMAIL_ALREADY_EXISTS: 'Driver with this email already exists',
  DRIVER_LICENSE_NUMBER_EXISTS: 'Driver with this license number already exists',
  DRIVER_INVALID_STATUS: 'Invalid driver status',
  DRIVER_CANNOT_ACCEPT_RIDE: 'Driver cannot accept rides. Driver must be onboarded and available',
  QUOTE_PAYMENT_WINDOW_EXPIRED: 'Quote payment window has expired. Please request a new quote.',
  DRIVER_NOT_AVAILABLE: 'Driver is not available for the selected dates',
  VEHICLES_NOT_AVAILABLE: 'Selected vehicles are no longer available. Please select new vehicles.',
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
  NO_ADMIN_AVAILABLE: 'NO_ADMIN_AVAILABLE',
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  INVALID_USER_STATUS: 'INVALID_USER_STATUS',
  INVALID_USER_ROLE: 'INVALID_USER_ROLE',
  DRIVER_NOT_FOUND: 'DRIVER_NOT_FOUND',
  DRIVER_DUPLICATE_EMAIL: 'DRIVER_DUPLICATE_EMAIL',
  DRIVER_DUPLICATE_LICENSE: 'DRIVER_DUPLICATE_LICENSE',
  INVALID_DRIVER_STATUS: 'INVALID_DRIVER_STATUS',
  INVALID_DRIVER_ID: 'INVALID_DRIVER_ID',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  DRIVER_NOT_AVAILABLE: 'DRIVER_NOT_AVAILABLE',
  VEHICLES_NOT_AVAILABLE: 'VEHICLES_NOT_AVAILABLE',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;