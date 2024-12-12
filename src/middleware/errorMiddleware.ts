import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../exceptions/Error';

export default (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response | void => {
  console.error(err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    message: isProduction ? 'Internal Server Error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
