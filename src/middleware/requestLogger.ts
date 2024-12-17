import { Request, Response } from 'express';
import morgan from 'morgan';

import logger from '../logger';

// Определяем формат для morgan
const requestLogger = morgan(
  (tokens, req: Request, res: Response) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTime: `${tokens['response-time'](req, res)} ms`,
      userAgent: tokens['user-agent'](req, res),
      ip: req.ip,
    });
  },
  {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  }
);

export default requestLogger;
