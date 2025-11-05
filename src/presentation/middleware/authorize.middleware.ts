import { NextFunction, Response } from 'express';
import { UserRole } from '../../shared/constants';
import { ERROR_MESSAGES, HTTP_STATUS } from '../../shared/constants';
import { AuthenticatedRequest } from '../../shared/types/express.types';
import { sendErrorResponse } from '../../shared/utils/response.util';

/**
 * Authorization middleware factory
 */
export function authorize(allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // Check if user is authenticated
    if (!req.user) {
      sendErrorResponse(res, new Error(ERROR_MESSAGES.UNAUTHORIZED));
      return;
    }

    // Check if user has a role
    if (!req.user.role) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
      return;
    }

    // Check if user's role is in the allowed roles list
    const userRole = req.user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = authorize([UserRole.ADMIN]);

/**
 * Middleware to check if user is authenticated (no role check)
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendErrorResponse(res, new Error(ERROR_MESSAGES.UNAUTHORIZED));
    return;
  }
  next();
}

