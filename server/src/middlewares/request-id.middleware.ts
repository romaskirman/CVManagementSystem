import { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';

type RequestWithId = Request & {
  requestId?: string;
};

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const request = req as RequestWithId;
  const headerRequestId = request.header('x-request-id');
  const requestId = headerRequestId || crypto.randomUUID();

  request.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  next();
}
