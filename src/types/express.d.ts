import 'express';

export interface LoggedInUserData {
  id: string;
  deviceId: string;
  ip?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: LoggedInUserData;
    }
  }
}
