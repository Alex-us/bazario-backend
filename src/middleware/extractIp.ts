import { Request, Response, NextFunction } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  const forwarded = req.headers['x-forwarded-for']?.toString().split(',')[0];
  const remoteAddress = req.socket.remoteAddress;

  req.body.ip = forwarded || remoteAddress || req.ip;
  next();
};
