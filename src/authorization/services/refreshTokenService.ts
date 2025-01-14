import jwt, { JsonWebTokenError } from 'jsonwebtoken';

import { ERROR_MESSAGE, REFRESH_TOKEN_EXP, LoggerTags } from '../../constants';
import {
  deleteRefreshTokenFromDb,
  getRefreshTokenFromDb,
  saveRefreshTokenToDb,
} from '../../database/redis/refreshToken';
import { RefreshTokenError } from '../../errors/token';
import { createTaggedLogger } from '../../logger';
import { CognitoIdTokenPayload } from '../../types';

const MODULE_NAME = 'refresh_token_service';
const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

export const generateRefreshTokenAndSaveToDb = async (
  userId: string,
  deviceId: string
) => {
  logger.info('Generating refresh token', { id: userId, deviceId });

  const payload: CognitoIdTokenPayload = { id: userId, deviceId };
  const newToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXP,
  });

  logger.info('Refresh token signed successfully', { id: userId, deviceId });

  await saveRefreshTokenToDb(userId, deviceId, newToken);
  return newToken;
};

export const decodeRefreshTokenOrThrow = (
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
    throw new RefreshTokenError((err as JsonWebTokenError).message);
  }
};

export const validateRefreshTokenOrThrow = async (
  userId: string,
  deviceId: string,
  token: string
) => {
  logger.info('Validating refresh token', { id: userId, deviceId });
  const payload = decodeRefreshTokenOrThrow(token);

  if (!payload || payload.id !== userId || payload.deviceId !== deviceId) {
    throw new RefreshTokenError(ERROR_MESSAGE.INVALID_REFRESH_TOKEN);
  }

  const storedToken = await getRefreshTokenFromDb(userId, deviceId);
  if (storedToken !== token) {
    throw new RefreshTokenError(ERROR_MESSAGE.INVALID_REFRESH_TOKEN);
  }
};

export const deleteRefreshToken = async (userId: string, deviceId: string) => {
  await deleteRefreshTokenFromDb(userId, deviceId);
};
