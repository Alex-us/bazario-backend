import { Language } from '../constants';

export interface EmailProps {
  to: string;
  subject: string;
  html: string;
}

export interface EmailPayload {
  token: string;
  language: Language;
}

export interface NewDeviceLoginEmailPayload extends EmailPayload {
  ip?: string;
  userAgent?: string;
}

export type Recipient = {
  email?: string;
  phone?: string;
  pushToken?: string;
  telegramId?: string;
};

export type EmailNotificationPayload = NewDeviceLoginEmailPayload | EmailPayload;
