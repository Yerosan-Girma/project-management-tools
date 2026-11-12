import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { env } from './env';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' }
          ]
        : [{ emit: 'stdout', level: 'error' }],
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

// Log queries in development if desired
if (env.NODE_ENV === 'development') {
  (prisma as any).$on?.('query', (e: any) => {
    logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma Query');
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
