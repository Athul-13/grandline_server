/**
 * Application configuration constants
 * Centralizes all app-wide settings and environment variable handling
 */
export const APP_CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-api',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
} as const;

/**
 * Redis configuration constants
 * Handles OTP storage and temporary data management
 */
export const REDIS_CONFIG = {
  URI: process.env.REDIS_URI || 'redis://172.27.169.219:6379',
} as const;

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
 * OTP configuration constants
 * Manages one-time password generation and expiry
 */
export const OTP_CONFIG = {
  LENGTH: 6,                    // OTP is 6 digits
  EXPIRY_TIME: 120000,          // 2 minutes in milliseconds
  REDIS_PREFIX: 'otp:',        
} as const;