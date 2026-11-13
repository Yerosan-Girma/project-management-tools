import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { env } from './env';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      env.NODE_ENV === 'test'
        ? [{ emit: 'stdout', level: 'error' }]
        : [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            ...(env.NODE_ENV === 'development' ? [{ emit: 'stdout' as const, level: 'warn' as const }] : [])
          ],
    // Connection pool settings optimized for Render/PostgreSQL
    datasources: {
      db: {
        url: env.DATABASE_URL
      }
    }
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Log only slow-query timing, never SQL text or parameter values (which may contain user data).
if (env.NODE_ENV !== 'test') {
  prisma.$on('query', (event) => {
    if (event.duration >= env.SLOW_QUERY_THRESHOLD_MS) {
      logger.warn(
        { durationMs: event.duration, thresholdMs: env.SLOW_QUERY_THRESHOLD_MS },
        'Slow database query'
      );
    }
  });
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('🐘 Connected to PostgreSQL database via Prisma ORM successfully.');
  } catch (error: any) {
    logger.error(`❌ Failed to connect to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('🐘 Disconnected from PostgreSQL database.');
  } catch (error: any) {
    logger.error(`❌ Error disconnecting Prisma: ${error.message}`);
  }
}
