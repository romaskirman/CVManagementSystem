import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../common/errors/ValidationError';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: AnyZodObject, target: ValidationTarget = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const flattened = error.flatten();
        const firstFieldError = Object.values(flattened.fieldErrors).find(Boolean)?.[0];
        const firstFormError = flattened.formErrors[0];

        next(
          new ValidationError(firstFieldError || firstFormError || 'Request validation failed', {
            fieldErrors: flattened.fieldErrors
          })
        );
        return;
      }

      next(error);
    }
  };
}
