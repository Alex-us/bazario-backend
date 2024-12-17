import { UserBlockReasons } from '../models/user';

export interface MailProps {
  type: UserBlockReasons;
  to: string;
  token: string;
  ip?: string;
  userAgent?: string;
}
