import { Request, Response, NextFunction } from 'express';

import { LoggerTags, REQUESTS_AMOUNT_LIMIT_LOGIN } from '../../constants';
import { UnauthorizedError } from '../../errors';
import { createTaggedLogger } from '../../logger';
import { createRateLimiter } from '../../middleware/rateLimiter';
import { validateAccessTokenOrThrow } from '../services/accessTokenService';

const MODULE_NAME = 'auth_middleware';
const logger = createTaggedLogger([LoggerTags.EXPRESS, MODULE_NAME]);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Trying to check access token');
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      logger.error('No authorization header');
      return next(new UnauthorizedError());
    }

    const accessToken = authorizationHeader.split(' ')[1];
    const userData = await validateAccessTokenOrThrow(accessToken);

    if (!userData || !userData.id || !userData.deviceId) {
      logger.error('Access token is not valid');
      return next(new UnauthorizedError());
    }

    req.user = {
      id: userData.id,
      deviceId: userData.deviceId,
    };

    logger.info('User authorized', { id: userData.id, deviceId: userData.deviceId });
    next();
  } catch (error) {
    logger.error('Error while checking access token:', { error });
    next(new UnauthorizedError());
  }
};

export const loginLimiterMiddleware = createRateLimiter(
  REQUESTS_AMOUNT_LIMIT_LOGIN,
  logger
);
