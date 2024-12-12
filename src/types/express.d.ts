import { Request as ExpressRequest, Response, NextFunction } from 'express';

export interface LoggedInUserData {
  id: string;
  deviceId;
}

export interface Request extends ExpressRequest {
  user?: LoggedInUserData;
}

export { Response, NextFunction };
