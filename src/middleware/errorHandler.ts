import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../errors/Error';
import { createTaggedLogger } from '../logger';
import { LoggerTags } from '../logger/constants';

const MODULE_NAME = 'error_middleware';
const logger = createTaggedLogger([LoggerTags.EXPRESS, MODULE_NAME]);

export default (
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
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    message: isProduction ? 'Internal Server Error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
