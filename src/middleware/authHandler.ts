import { Request, Response, NextFunction } from 'express';

import { UnauthorizedError } from '../errors/Error';
import { createTaggedLogger } from '../logger';
import { LoggerTags } from '../logger/constants';
import { validateAccessTokenAndReturnUserData } from '../services/tokenService';

const MODULE_NAME = 'auth_middleware';
const logger = createTaggedLogger([LoggerTags.EXPRESS, MODULE_NAME]);

export default (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Trying to check access token');
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      logger.error('No authorization header');
      return next(new UnauthorizedError());
    }

    const accessToken = authorizationHeader.split(' ')[1];
    const userData = validateAccessTokenAndReturnUserData(accessToken);

    if (!userData) {
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
