import { NextFunction, Response } from 'express';
import { container } from 'tsyringe';
import { IJWTService } from '../../domain/services/jwt_service.interface';
import { SERVICE_TOKENS } from '../../infrastructure/di/tokens';
import { COOKIE_NAMES, ERROR_MESSAGES, HTTP_STATUS } from '../../shared/constants';
import { AuthenticatedRequest } from '../../shared/types/express.types';

/**
 * Authentication middleware factory
 * Creates middleware that verifies JWT tokens and attaches user info to request
 */
function createAuthMiddleware(jwtService: IJWTService) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract token from cookie (primary method)
      let token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

      // Fallback to Authorization header if cookie not found
      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      // No token found
      if (!token) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Verify token and extract payload
      try {
        const payload = await jwtService.verifyAccessToken(token);
        req.user = payload;
        next();
      } catch (error) {
        // Token verification failed
        const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNAUTHORIZED;
        
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message,
        });
        return;
      }
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.SERVER_ERROR,
      });
      return;
    }
  };
}

/**
 * Authentication middleware
 * Lazily resolves JWT service from DI container to avoid initialization order issues
 */
let cachedJwtService: IJWTService | null = null;

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Lazy resolve JWT service on first use
  if (!cachedJwtService) {
    cachedJwtService = container.resolve<IJWTService>(SERVICE_TOKENS.IJWTService);
  }
  
  const middleware = createAuthMiddleware(cachedJwtService);
  return middleware(req, res, next);
};

