import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { LoggerTags, REQUESTS_AMOUNT_LIMIT } from '../constants';
import { ApiError, BadRequestError } from '../errors';
import { TokenError } from '../errors/token';
import { UserError } from '../errors/user';
import { createTaggedLogger } from '../logger';
import { createRateLimiter } from './rateLimiter';

const MODULE_NAME = 'middleware';
const logger = createTaggedLogger([LoggerTags.EXPRESS, MODULE_NAME]);

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response | void => {
  logger.error('Express error', {
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
    error: err,
  });
  switch (true) {
    case err instanceof ApiError:
      return res.status(err.statusCode).json({ message: err.message });
    case err instanceof TokenError:
    case err instanceof UserError:
      return res.status(400).json({ message: err.message });
    default: {
      const isProduction = process.env.NODE_ENV === 'production';
      return res.status(500).json({
        message: isProduction ? 'Internal Server Error' : err.message,
        ...(isProduction ? {} : { stack: err.stack }),
      });
    }
  }
};

export const extractIpMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const forwarded = req.headers['x-forwarded-for']?.toString().split(',')[0];
  const remoteAddress = req.socket.remoteAddress;

  req.body.ip = forwarded || remoteAddress || req.ip;
  next();
};

export const validationResultMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array()[0].msg;
    next(new BadRequestError(message));
  }
  next();
};

export const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(404).send('Not Found');
};

export const requestsLimiterMiddleware = createRateLimiter(REQUESTS_AMOUNT_LIMIT, logger);

export * from './logger';
