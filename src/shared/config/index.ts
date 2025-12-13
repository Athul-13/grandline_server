/**
 * Application configuration constants
 * Centralizes app-wide settings and environment variable handling
 */
export const APP_CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-api',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
} as const;

/**
 * JWT token configuration constants
 * Manages access token and refresh token expiry times
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '30m', // 30 minutes
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d', // 7 days
  RESET_PASSWORD_TOKEN_EXPIRY: process.env.RESET_PASSWORD_TOKEN_EXPIRY || '5m', // 5 minutes
} as const;

/**
 * Redis configuration constants
 * Handles OTP storage and temporary data management
 */
export const REDIS_CONFIG = {
  URI: process.env.REDIS_URI || 'redis://172.27.169.219:6379',
} as const;

/**
 * Server/middleware configuration constants
 * Manages Express middleware settings like CORS, body parser limits, etc.
 */
export const SERVER_CONFIG = {
  CORS: {
    origin: process.env.CORS_ORIGIN || '*', // In production, set specific origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  BODY_PARSER: {
    json: { limit: '10mb' },
    urlencoded: { extended: true, limit: '10mb' },
  },
} as const;

/**
 * Database connection configuration constants
 * Manages retry logic and connection timeouts
 */
export const DATABASE_CONFIG = {
  MONGODB: {
    RETRY_ATTEMPTS: parseInt(process.env.MONGODB_RETRY_ATTEMPTS || '3', 10),
    RETRY_DELAY: parseInt(process.env.MONGODB_RETRY_DELAY || '1000', 10), // milliseconds
    CONNECTION_TIMEOUT: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT || '30000', 10), // 30 seconds
  },
  REDIS: {
    RETRY_ATTEMPTS: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3', 10),
    RETRY_DELAY: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10), // milliseconds
    CONNECTION_TIMEOUT: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000', 10), // 5 seconds
  },
} as const;

/**
 * Email configuration constants
 * Manages SMTP settings for sending emails via Gmail
 */
export const EMAIL_CONFIG = {
  HOST: 'smtp.gmail.com',
  PORT: 587,
  SECURE: false, // true for 465, false for 587 (STARTTLS)
  USER: process.env.EMAIL_USER || '',
  PASS: process.env.EMAIL_PASS || '',
} as const;

/**
 * Frontend configuration constants
 * Manages frontend URLs for email links and redirects
 */
export const FRONTEND_CONFIG = {
  URL: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;

/**
 * Mobile app configuration constants
 * Manages mobile app deep links for password reset
 */
export const MOBILE_CONFIG = {
  SCHEME: 'grandlinemobile',
  DEEP_LINK_BASE: 'grandlinemobile://reset-password',
} as const;

/**
 * Cloudinary configuration constants
 * Manages Cloudinary cloud storage settings for file uploads
 */
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  API_KEY: process.env.CLOUDINARY_API_KEY || '',
  API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  UPLOAD_URL: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || ''}/image/upload`,
  SIGNED_URL_EXPIRY: 300, // 5 minutes - fixed for security
} as const;

/**
 * Mapbox configuration constants
 * Manages Mapbox API settings for route calculation
 */
export const MAPBOX_CONFIG = {
  ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || '',
  API_BASE_URL: 'https://api.mapbox.com/directions/v5',
} as const;

/**
 * Stripe configuration constants
 * Manages Stripe payment processing settings
 */
export const STRIPE_CONFIG = {
  SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
} as const;