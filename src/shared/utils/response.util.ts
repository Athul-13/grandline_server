import { Response } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

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
};

/**
 * Sends a success response with optional message
 * Uses generics to accept any object type without type casting
 */
export function sendSuccessResponse<T extends object>(
  res: Response,
  statusCode: number,
  data: T,
  message?: string
): void {
  const response: Record<string, unknown> = {
    success: true,
    ...(data as Record<string, unknown>),
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

/**
 * Sends an error response
 * Automatically maps error messages to appropriate HTTP status codes
 */
export function sendErrorResponse(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR;
  const statusCode = ERROR_TO_STATUS_MAP[message] || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message,
  });
}

