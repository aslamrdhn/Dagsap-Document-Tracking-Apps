import { Redis } from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL;

// Setup Redis instance conditionally
export const redisClient = redisUrl ? new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying after 3 times
    return Math.min(times * 1000, 3000);
  },
}) : {
  status: 'end',
  on: () => {},
  connect: async () => {},
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  incr: async () => 0,
  incrby: async () => 0,
} as unknown as Redis;

let hasLoggedRedisError = false;

if (redisUrl) {
  redisClient.on('error', (err) => {
    if (!hasLoggedRedisError) {
      logger.warn('Redis connection failed, continuing without cache');
      hasLoggedRedisError = true;
    }
  });

  redisClient.on('connect', () => {
    logger.info('Connected to Redis Cache');
  });
}

/**
 * Initiates the connection to the Redis server if one is configured.
 * Safely handles connection failures by falling back to standard execution without cache.
 * @returns {Promise<void>} Resolves when the connection succeeds or gracefully fails.
 */
export async function connectRedis() {
  if (!process.env.REDIS_URL) {
    logger.info('No REDIS_URL provided, running without cache.');
    return;
  }

  try {
    if (process.env.NODE_ENV !== 'test') {
      await redisClient.connect();
    }
  } catch (err) {
    logger.warn('Could not connect to Redis, falling back to direct DB queries.');
  }
}
