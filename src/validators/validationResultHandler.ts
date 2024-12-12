import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { BadRequestError } from '../exceptions/Error';

export default (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array()[0].msg;
    next(new BadRequestError(message));
  }
  next();
};
