import { REFRESH_TOKEN_EXP, REFRESH_TOKEN_KEY_PREFIX, LoggerTags } from '../../constants';
import { createTaggedLogger } from '../../logger';
import { redisClient } from './client';

const MODULE_NAME = 'refresh_token';
const logger = createTaggedLogger([LoggerTags.DB, LoggerTags.REDIS, MODULE_NAME]);

const getRefreshTokenRedisKey = (userId: string, deviceId: string) => {
  return `${REFRESH_TOKEN_KEY_PREFIX}${userId}:${deviceId}`;
};

export const getRefreshTokenFromDb = async (userId: string, deviceId: string) => {
  try {
    logger.info('Getting refresh token from Db', { id: userId, deviceId });
    const key = getRefreshTokenRedisKey(userId, deviceId);
    const token = await redisClient.get(key);
    logger.info('Got refresh token from Db successfully', { id: userId, deviceId });
    return token;
  } catch (err) {
    logger.error('Error while getting Refresh token from Db', { error: err });
  }
};

export const deleteRefreshTokenFromDb = async (userId: string, deviceId: string) => {
  logger.info('Deleting refresh token from Db', { id: userId, deviceId });
  try {
    const key = getRefreshTokenRedisKey(userId, deviceId);
    await redisClient.del(key);
    logger.info('Refresh token deleted from Db successfully', { id: userId, deviceId });
  } catch (err) {
    logger.error('Error while deleting Refresh token from Db', { error: err });
  }
};

export const saveRefreshTokenToDb = async (
  userId: string,
  deviceId: string,
  token: string
) => {
  const key = getRefreshTokenRedisKey(userId, deviceId);

  await deleteRefreshTokenFromDb(userId, deviceId);

  await redisClient.set(key, token, {
    EX: REFRESH_TOKEN_EXP,
  });
  logger.info('New Refresh token saved to Redis', { id: userId, deviceId });
};
