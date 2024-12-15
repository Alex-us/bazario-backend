import { createClient, RedisClientType } from 'redis';

import { createTaggedLogger } from '../logger';
import { LoggerTags } from '../logger/constants';

const MODULE_NAME = 'redis';
const logger = createTaggedLogger([LoggerTags.DB, MODULE_NAME]);
let redisClient: RedisClientType;

export const getRedisClient = () => {
  if (!redisClient) {
    try {
      redisClient = createClient({
        username: 'default',
        password: 'uGTQMPsGkznzGLpqqIvsX6zLvSaWL8NP',
        socket: {
          host: process.env.REDIS_URI,
          port: 11029,
        },
      });

      redisClient.on('error', err => console.log('Redis Client Error', err));
    } catch (err) {
      logger.error('Error creating redis client', { error: err });
    }
  }
  return redisClient;
};

export const connectRedis = async () => {
  try {
    await getRedisClient()?.connect();
    logger.info('Redis connected successfully');
  } catch (err) {
    logger.error('Error while connecting to redis', { error: err });
  }
};
