import { Redis } from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Setup Redis instance
export const redisClient = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying after 3 times
    return Math.min(times * 1000, 3000);
  },
});

let hasLoggedRedisError = false;

redisClient.on('error', (err) => {
  if (!hasLoggedRedisError) {
    logger.warn('Redis connection failed, continuing without cache');
    hasLoggedRedisError = true;
  }
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis Cache');
});

export async function connectRedis() {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await redisClient.connect();
    }
  } catch (err) {
    logger.warn('Could not connect to Redis, falling back to direct DB queries.');
  }
}
