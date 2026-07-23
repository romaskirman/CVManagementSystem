import { NextFunction, Request, Response } from 'express';
import { AuthError } from '../common/errors/AuthError';

type RequestUser = {
  isBlocked: boolean;
};

export function rejectBlockedUsers(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user as RequestUser | undefined;

  if (user?.isBlocked) {
    return next(new AuthError('User is blocked'));
  }

  next();
}
