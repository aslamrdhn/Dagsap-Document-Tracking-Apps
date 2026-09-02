import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationSchemas {
  params?: ZodSchema;
  query?: ZodSchema;
  body?: ZodSchema;
}

/**
 * Middleware that intercepts incoming requests and validates them against Zod schemas.
 * Ensures the 'body', 'query', and 'params' properties of the request match the expected types.
 * Strongly typed validation happens synchronously before hitting route controllers.
 * @param schemas - An object containing Zod schemas for params, query, and/or body.
 * @returns An Express middleware function.
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }
      next(error);
    }
  };
};
