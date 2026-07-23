import { Prisma } from '@prisma/client';
import { ConflictError } from '../common/errors/ConflictError';

export function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictError('Unique constraint violation', {
        target: error.meta?.target
      });
    }
  }

  throw error;
}
