import { NextFunction, Request, RequestHandler, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../config/db';

interface AccessTokenPayload extends JwtPayload {
  userId: string;
}

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

async function resolveUserFromToken(token: string): Promise<Express.User | null> {
  const decoded = jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET as string
  ) as AccessTokenPayload;

  if (!decoded?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    isBlocked: user.isBlocked,
    roles: user.roles.map((item) => item.role.code)
  } as Express.User;
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      next();
      return;
    }

    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication required' });
      return;
    }

    const resolvedUser = await resolveUserFromToken(token);

    if (!resolvedUser) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid or expired token' });
      return;
    }

    req.user = resolvedUser;
    next();
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      next();
      return;
    }

    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    const resolvedUser = await resolveUserFromToken(token);

    if (!resolvedUser) {
      next();
      return;
    }

    req.user = resolvedUser;
    next();
  } catch {
    next();
  }
};
