import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

const createPrismaClient = () =>
  new PrismaClient({
    log: ['warn', 'error']
  });

export const prisma = global.__prisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma;
}
