export interface EmailProps {
  to: string;
  subject: string;
  html: string;
}

export interface EmailPayload {
  token: string;
}

export interface NewDeviceLoginEmailPayload extends EmailPayload {
  ip?: string;
  userAgent?: string;
}
