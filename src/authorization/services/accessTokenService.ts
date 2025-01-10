import jwt, { JsonWebTokenError } from 'jsonwebtoken';

import { ERROR_MESSAGE } from '../../errors/constants';
import { AccessTokenError } from '../../errors/token';
import { createTaggedLogger } from '../../logger';
import { LoggerTags } from '../../logger/constants';
import { ACCESS_TOKEN_EXP } from '../constants';
import { CognitoIdTokenPayload } from '../types';

const MODULE_NAME = 'access_token_service';
const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

export const generateAccessToken = (userId: string, deviceId: string) => {
  logger.info('Generating Access token', { id: userId, deviceId });
  const payload: CognitoIdTokenPayload = { id: userId, deviceId };
  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXP,
  });
  logger.info('Access token signed successfully', { id: userId, deviceId });
  return token;
};

export const decodeAccessTokenOrThrow = (
  accessToken: string
): CognitoIdTokenPayload | undefined => {
  logger.info('Decoding access token');
  if (!accessToken) {
    throw new AccessTokenError(ERROR_MESSAGE.EMPTY_ACCESS_TOKEN);
  }

  try {
    return jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET as string
    ) as CognitoIdTokenPayload;
  } catch (err) {
    logger.error('Error decoding access token', { error: err });
    throw new AccessTokenError((err as JsonWebTokenError).message);
  }
};

export const validateAccessTokenOrThrow = async (accessToken: string) => {
  if (!accessToken) {
    return false;
  }

  logger.info('Start Validating access token');

  const payload = decodeAccessTokenOrThrow(accessToken);
  if (!payload || !payload.id || !payload.deviceId) {
    logger.info('Access token is not valid');
    throw new AccessTokenError(ERROR_MESSAGE.INVALID_ACCESS_TOKEN);
  }
  const { id, deviceId } = payload;
  const userData = { id, deviceId };
  logger.info('Access token decoded', { ...payload });

  // TODO: Do we really need to ask DB on every request?
  // const userFromDB = await findUserByIdOrThrow(id);
  //
  // logger.info('User found in DB', { ...userData, email: userFromDB.email });
  return userData;
};
