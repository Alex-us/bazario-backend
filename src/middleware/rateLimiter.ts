import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Logger } from 'winston';

import { REQUESTS_RATE_LIMITER_WINDOW } from '../constants';
import { TooManyRequestsError } from '../errors';

export const createRateLimiter = (limit: number, logger: Logger) => {
  return rateLimit({
    windowMs: REQUESTS_RATE_LIMITER_WINDOW,
    limit,
    handler: (req: Request, _res: Response, next: NextFunction) => {
      logger.warn('Rate limit exceeded', { ip: req.ip, url: req.originalUrl });
      next(new TooManyRequestsError());
    },
  });
};
