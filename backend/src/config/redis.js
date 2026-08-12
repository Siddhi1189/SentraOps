import Redis from 'ioredis';
import env from './env.js';
import logger from '../utils/logger.js';

// Standard Redis client connection
const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required for compatibility with BullMQ if we share connections
});

redis.on('connect', () => {
  logger.info('Connected to Redis server.');
});

redis.on('error', (err) => {
  logger.error(`Redis connection error: ${err.message}`);
});

const redisConnectionOptions = {
  connection: {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
  }
};

export { redis, Redis, redisConnectionOptions };
export default {
  redis,
  Redis,
  redisConnectionOptions,
};
