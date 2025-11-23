import { Response } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import { AppError } from './app_error.util';

/**
 * Maps error messages to HTTP status codes
 * Centralized mapping for consistent error responses
 */
const ERROR_TO_STATUS_MAP: Record<string, number> = {
  [ERROR_MESSAGES.EMAIL_ALREADY_EXISTS]: HTTP_STATUS.CONFLICT,
  [ERROR_MESSAGES.INVALID_CREDENTIALS]: HTTP_STATUS.UNAUTHORIZED,
  [ERROR_MESSAGES.ACCOUNT_NOT_VERIFIED]: HTTP_STATUS.UNAUTHORIZED,
  [ERROR_MESSAGES.USER_NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
  [ERROR_MESSAGES.OTP_INVALID_OR_EXPIRED]: HTTP_STATUS.BAD_REQUEST,
  [ERROR_MESSAGES.TOKEN_REVOKED]: HTTP_STATUS.UNAUTHORIZED,
  [ERROR_MESSAGES.TOKEN_EXPIRED]: HTTP_STATUS.UNAUTHORIZED,
  [ERROR_MESSAGES.INVALID_RESET_TOKEN]: HTTP_STATUS.UNAUTHORIZED,
  [ERROR_MESSAGES.UNAUTHORIZED]: HTTP_STATUS.UNAUTHORIZED,
  [ERROR_MESSAGES.FORBIDDEN]: HTTP_STATUS.FORBIDDEN,
  [ERROR_MESSAGES.BAD_REQUEST]: HTTP_STATUS.BAD_REQUEST,
  [ERROR_MESSAGES.SERVER_ERROR]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  [ERROR_MESSAGES.ACCOUNT_ALREADY_EXISTS]: HTTP_STATUS.CONFLICT,
  [ERROR_MESSAGES.ACCOUNT_EXISTS_WITH_EMAIL]: HTTP_STATUS.CONFLICT,
  [ERROR_MESSAGES.GOOGLE_ACCOUNT_ALREADY_LINKED]: HTTP_STATUS.CONFLICT,
  [ERROR_MESSAGES.GOOGLE_EMAIL_MISMATCH]: HTTP_STATUS.BAD_REQUEST,
  [ERROR_MESSAGES.INVALID_GOOGLE_TOKEN]: HTTP_STATUS.UNAUTHORIZED,
};

/**
 * Sends a success response with optional message
 * Uses generics to accept any object type without type casting
 * Handles arrays by wrapping them in a 'data' property
 */
export function sendSuccessResponse<T extends object>(
  res: Response,
  statusCode: number,
  data: T,
  message?: string
): void {
  const response: Record<string, unknown> = {
    success: true,
  };

  // Check if data is an array
  if (Array.isArray(data)) {
    response.data = data;
  } else {
    // Spread object properties
    Object.assign(response, data as Record<string, unknown>);
  }

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

/**
 * Sends an error response
 * Automatically maps error messages to appropriate HTTP status codes
 * Uses AppError.statusCode if error is an AppError instance
 */
export function sendErrorResponse(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR;
  
  // If error is an AppError, use its statusCode property
  let statusCode: number;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  } else {
    // Fallback to error message mapping or default to 500
    statusCode = ERROR_TO_STATUS_MAP[message] || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

