import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../common/errors/AppError';
import { logger } from '../utils/logger';

type RequestWithId = Request & {
  requestId?: string;
};

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const request = req as RequestWithId;

  if (error instanceof AppError) {
    logger.error({
      requestId: request.requestId,
      message: error.message,
      code: error.code,
      path: request.originalUrl,
      details: error.details
    });

    res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
      requestId: request.requestId
    });

    return;
  }

  logger.error({
    requestId: request.requestId,
    message: 'Unhandled error',
    path: request.originalUrl,
    error
  });

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    requestId: request.requestId
  });
}
