import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../../shared/constants';
import { logger } from '../../shared/logger';

type ClassConstructor<T = object> = new (...args: unknown[]) => T;

/**
 * Flattens nested validation errors into a single array
 * Handles nested objects and arrays in DTOs
 */
function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = ''
): { property: string; constraints: Record<string, string> }[] {
  return errors.flatMap((error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    const currentErrors = error.constraints
      ? [{ property: path, constraints: error.constraints }]
      : [];

    const childErrors = error.children
      ? flattenValidationErrors(error.children, path)
      : [];

    return [...currentErrors, ...childErrors];
  });
}

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a DTO class
 * Returns validated DTO instance in req.body
 */
export const validationMiddleware = <T extends object>(dtoClass: ClassConstructor<T>) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Only validate request body
      const data = (req.body || {}) as Record<string, unknown>;

      // Transform plain object to DTO class instance
      const dtoObj = plainToInstance(dtoClass, data);

      // Run validators with security options
      const errors = await validate(dtoObj, {
        whitelist: true, 
        forbidNonWhitelisted: true, 
      });

      // If validation errors exist
      if (errors.length > 0) {
        const detailedErrors = flattenValidationErrors(errors);

        // Get the first available error message (user-friendly)
        const firstError = detailedErrors[0];
        const firstMessage = firstError
          ? Object.values(firstError.constraints)[0]
          : 'Validation failed';

        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: firstMessage,
        });
        return;
      }

      req.body = dtoObj;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal validation error',
      });
      return;
    }
  };
};

