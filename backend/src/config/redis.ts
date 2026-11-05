import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  if (!env.REDIS_URL) {
    logger.info('ℹ️ Redis URL not configured. Running in single-instance in-memory mode.');
    return null;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('⚠️ Redis connection attempts exceeded. Disabling Redis integration.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      }
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('✅ Redis connected successfully.');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn(`⚠️ Redis error (fallback mode active): ${err.message}`);
    });

    // Attempt non-blocking connection
    redisClient.connect().catch((err) => {
      isRedisAvailable = false;
      logger.warn(`⚠️ Redis failed to connect on startup: ${err.message}. Operating in fallback mode.`);
    });

    return redisClient;
  } catch (error) {
    logger.warn('⚠️ Could not initialize Redis client. Falling back to local memory.');
    return null;
  }
}

export function isRedisConnected(): boolean {
  return isRedisAvailable;
}
