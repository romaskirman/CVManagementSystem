import { NextFunction, Request, Response } from 'express';
import { RoleCode } from '@prisma/client';
import { ForbiddenError } from '../common/errors/ForbiddenError';
import { RequestUser } from '../common/types/request-user.type';

export function requireRoles(...allowedRoles: RoleCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user as RequestUser | undefined;

    if (!user) {
      return next(new ForbiddenError('User is not authenticated'));
    }

    const hasRole = allowedRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}
