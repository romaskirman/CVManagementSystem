import { createServer } from 'node:http';
import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/db';

const server = createServer(app);

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();

    server.listen(env.SERVER_PORT, () => {
      console.log(`Server is running on ${env.SERVER_URL}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down...`);

      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void bootstrap();
