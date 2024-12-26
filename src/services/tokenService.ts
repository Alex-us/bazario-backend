import { Response } from 'express';
import jwt from 'jsonwebtoken';

import { REFRESH_TOKEN_KEY_PREFIX } from '../constants/database';
import { LoggerTags } from '../constants/logger';
import { ACCESS_TOKEN_EXP, REFRESH_TOKEN_EXP } from '../constants/services/token';
import { redisClient } from '../database/redisClient';
import { createTaggedLogger } from '../logger';
import { CognitoIdTokenPayload } from '../types/services/token';
import { findUserById } from './authService';

const MODULE_NAME = 'token_service';
const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

const getRefreshTokenRedisKey = (userId: string, deviceId: string) => {
  return `${REFRESH_TOKEN_KEY_PREFIX}${userId}:${deviceId}`;
};

export const generateAccessToken = (userId: string, deviceId: string) => {
  logger.info('Generating Access token', { id: userId, deviceId });
  const payload: CognitoIdTokenPayload = { id: userId, deviceId };
  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXP,
  });
  logger.info('Access token signed successfully', { id: userId, deviceId });
  return token;
};

export const generateRefreshToken = async (userId: string, deviceId: string) => {
  logger.info('Generating refresh token', { id: userId, deviceId });

  const payload: CognitoIdTokenPayload = { id: userId, deviceId };
  const newToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXP,
  });

  logger.info('Refresh token signed successfully', { id: userId, deviceId });

  const key = getRefreshTokenRedisKey(userId, deviceId);

  await deleteRefreshTokenFromDb(userId, deviceId);

  logger.info('Old refresh token deleted from Redis', { id: userId, deviceId });

  await redisClient.set(key, newToken, {
    EX: REFRESH_TOKEN_EXP / 1000,
  });
  logger.info('New Refresh token saved to Redis', { id: userId, deviceId });
  return newToken;
};

export const decodeAccessToken = (
  accessToken: string
): CognitoIdTokenPayload | undefined => {
  try {
    logger.info('Decoding access token');
    return jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET as string
    ) as CognitoIdTokenPayload;
  } catch (err) {
    logger.error('Error decoding access token', { error: err });
  }
};

export const decodeRefreshToken = (
  accessToken: string
): CognitoIdTokenPayload | undefined => {
  try {
    logger.info('Decoding refresh token');
    return jwt.verify(
      accessToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as CognitoIdTokenPayload;
  } catch (err) {
    logger.error('Error decoding refresh token', { error: err });
  }
};

export const validateRefreshToken = async (
  userId: string,
  deviceId: string,
  token: string
) => {
  logger.info('Validating refresh token', { id: userId, deviceId });
  const payload = decodeRefreshToken(token);

  if (!payload || payload.id !== userId || payload.deviceId !== deviceId) {
    return false;
  }

  const storedToken = await getRefreshTokenFromDb(userId, deviceId);
  const result = storedToken === token;
  logger.info('Validation refresh token done', { id: userId, deviceId, result });
  return result;
};

export const validateAccessTokenAndReturnUserData = (accessToken: string) => {
  if (!accessToken) {
    return false;
  }

  logger.info('Start Validating access token');

  const userData = decodeAccessToken(accessToken);
  if (!userData) {
    logger.info('Access token is not valid');
    return false;
  }
  logger.info('Refresh token decoded', { ...userData });
  const userFromDB = findUserById(userData.id);
  const result = !!userFromDB;
  logger.info('Refresh token decoded', { ...userData, result });
  return result && userData;
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

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  logger.info('Setting refresh token to cookies');
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXP,
  });
  logger.info('Set refresh token to cookies successfully');
};

export const clearRefreshTokenCookie = (res: Response) => {
  logger.info('Clear refresh token from cookies');
  res.clearCookie('refreshToken');
  logger.info('Clear refresh token from cookies done.');
};
