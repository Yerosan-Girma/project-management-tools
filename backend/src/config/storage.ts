import { env } from './env';
import { logger } from '../utils/logger';

export interface StorageConfig {
  endpoint?: string;
  bucket: string;
  accessKey?: string;
  secretKey?: string;
}

export const storageConfig: StorageConfig = {
  endpoint: env.STORAGE_ENDPOINT,
  bucket: env.STORAGE_BUCKET,
  accessKey: env.STORAGE_ACCESS_KEY,
  secretKey: env.STORAGE_SECRET_KEY
};

logger.info(`📦 Storage provider initialized for bucket: ${storageConfig.bucket}`);
