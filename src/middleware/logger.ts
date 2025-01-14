import { Request, Response } from 'express';
import morgan, { TokenIndexer } from 'morgan';

import { LoggerTags } from '../constants';
import { createTaggedLogger } from '../logger';

const MODULE_NAME = 'Request';
const logger = createTaggedLogger([LoggerTags.EXPRESS, MODULE_NAME]);

export const formatFn = (
  tokens: TokenIndexer<Request, Response>,
  req: Request,
  res: Response
) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTime: `${tokens['response-time'](req, res)} ms`,
    userAgent: tokens['user-agent'](req, res),
    ip: req.ip,
  });
};

export const options = {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
};

export const loggerMiddleware = morgan(formatFn, options);
