import { Response } from 'express';
import jwt from 'jsonwebtoken';

import { ACCESS_TOKEN_EXP, REFRESH_TOKEN_EXP } from '../constants';
import getRedisClient from '../redis/client';
import { REFRESH_TOKEN_KEY_PREFIX } from '../redis/constants';
import { findUserById } from './userService';

export interface CognitoIdTokenPayload {
  id: string;
  deviceId: string;
}

const getRefreshTokenRedisKey = (userId: string, deviceId: string) => {
  return `${REFRESH_TOKEN_KEY_PREFIX}${userId}:${deviceId}`;
};

export const generateAccessToken = (userId: string, deviceId: string) => {
  const payload: CognitoIdTokenPayload = { id: userId, deviceId };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXP,
  });
};

export const generateRefreshToken = async (
  userId: string,
  deviceId: string
) => {
  const payload: CognitoIdTokenPayload = { id: userId, deviceId };
  const newToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXP,
  });

  const key = getRefreshTokenRedisKey(userId, deviceId);
  console.info('Refresh token generated');

  await deleteRefreshTokenFromDb(userId, deviceId);
  console.info('Old refresh token deleted from Redis');
  await getRedisClient().set(key, newToken, {
    EX: REFRESH_TOKEN_EXP / 1000,
  });
  console.info('New Refresh token saved to Redis');
  return newToken;
};

export const decodeAccessToken = (
  accessToken: string
): CognitoIdTokenPayload | undefined => {
  try {
    return jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET as string
    ) as CognitoIdTokenPayload;
  } catch (err) {
    console.error('Error decoding access token', err);
  }
};

export const decodeRefreshToken = (
  accessToken: string
): CognitoIdTokenPayload | undefined => {
  try {
    return jwt.verify(
      accessToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as CognitoIdTokenPayload;
  } catch (err) {
    console.error('Error decoding refresh token', err);
  }
};

export const validateRefreshToken = async (
  userId: string,
  deviceId: string,
  token: string
) => {
  const payload = decodeRefreshToken(token);

  if (!payload || payload.id !== userId || payload.deviceId !== deviceId) {
    return false;
  }

  const storedToken = await getRefreshTokenFromDb(userId, deviceId);
  return storedToken === token;
};

export const validateAccessTokenAndReturnUserData = (accessToken: string) => {
  if (!accessToken) {
    return false;
  }

  const userData = decodeAccessToken(accessToken);
  if (!userData) {
    return false;
  }
  const userFromDB = findUserById(userData.id);
  return !!userFromDB && userData;
};

export const getRefreshTokenFromDb = async (
  userId: string,
  deviceId: string
) => {
  const key = getRefreshTokenRedisKey(userId, deviceId);
  return getRedisClient().get(key);
};

export const deleteRefreshTokenFromDb = async (
  userId: string,
  deviceId: string
) => {
  const key = getRefreshTokenRedisKey(userId, deviceId);
  await getRedisClient().del(key);
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXP,
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken');
};
