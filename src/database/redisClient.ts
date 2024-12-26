import { createClient, RedisClientType } from 'redis';

import { REDIS_CONNECTION_TIMEOUT } from '../constants/database';
import { LoggerTags } from '../constants/logger';
import { createTaggedLogger } from '../logger';

const MODULE_NAME = 'redis';
const logger = createTaggedLogger([LoggerTags.DB, MODULE_NAME]);

let redisClient: RedisClientType;

const initRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_URI,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 11029,
        connectTimeout: REDIS_CONNECTION_TIMEOUT,
        keepAliveInitialDelay: REDIS_CONNECTION_TIMEOUT,
      },
    });
    registerRedisEvents(redisClient);
  }
};

const registerRedisEvents = (client: RedisClientType) => {
  if (!client.listeners('connect').length) {
    client.on('connect', () =>
      logger.info(`Redis client connected to ${process.env.REDIS_URI}:${11029}`)
    );
    client.on('ready', () => logger.info('Redis client is ready'));
    client.on('reconnecting', () => logger.warn('Redis client reconnecting'));
    client.on('end', () => logger.warn('Redis client connection ended'));
    client.on('disconnect', () => logger.error('Redis client disconnected'));
    client.on('error', err => logger.error('Redis client error', { error: err }));
  }
};

const connectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    logger.info('Redis client already connected');
    return;
  }

  try {
    initRedisClient();

    if (!redisClient) {
      throw new Error('Redis client not initialized');
    }

    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (err) {
    logger.error('Error connecting to Redis', { error: err });
    throw err;
  }
};

const disconnectRedis = async () => {
  if (!redisClient) {
    logger.info('Redis client not connected');
    return;
  }
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
  redisClient.removeAllListeners();
  logger.info('Redis client disconnected');
};

export {
  redisClient,
  connectRedis,
  initRedisClient,
  registerRedisEvents,
  disconnectRedis,
};
