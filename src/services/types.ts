import { UserBlockReasons } from '../models/types/user';

export type credentialsData = {
  email: string;
  password: string;
  deviceId: string;
  ip?: string;
  userAgent?: string;
};

export interface MailProps {
  type: UserBlockReasons;
  to: string;
  token: string;
  ip?: string;
  userAgent?: string;
}

export interface CognitoIdTokenPayload {
  id: string;
  deviceId: string;
}
