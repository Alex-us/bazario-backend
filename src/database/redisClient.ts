import { createClient, RedisClientType } from 'redis';

import { LoggerTags } from '../constants/logger';
import { createTaggedLogger } from '../logger';

const MODULE_NAME = 'redis';
const logger = createTaggedLogger([LoggerTags.DB, MODULE_NAME]);

const redisClient: RedisClientType = createClient({
  username: 'default',
  password: 'uGTQMPsGkznzGLpqqIvsX6zLvSaWL8NP',
  socket: {
    host: process.env.REDIS_URI,
    port: 11029,
  },
});

redisClient.on('error', err => logger.error('Redis Client Error', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (err) {
    logger.error('Error while connecting to redis', { error: err });
  }
};

export { redisClient, connectRedis };
