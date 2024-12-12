import { Request, Response, NextFunction } from 'express';

import { UnauthorizedError } from '../exceptions/Error';
import { validateAccessTokenAndReturnUserData } from '../services/tokenService';

export default (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError());
    }

    const accessToken = authorizationHeader.split(' ')[1];
    const userData = validateAccessTokenAndReturnUserData(accessToken);

    if (!userData) {
      return next(new UnauthorizedError());
    }

    req.user = {
      id: userData.id,
      deviceId: userData.deviceId,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    next(new UnauthorizedError());
  }
};
