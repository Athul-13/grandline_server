import { Request } from 'express';
import { JWTPayload } from '../../domain/services/jwt_service.interface';

/**
 * Extended Express Request interface
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

