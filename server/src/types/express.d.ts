import 'express';
import { RoleCode } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      isBlocked: boolean;
      roles: RoleCode[];
    }

    interface Request {
      requestId?: string;
    }
  }
}

export {};
