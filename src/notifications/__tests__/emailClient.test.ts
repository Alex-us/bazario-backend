import nodemailer from 'nodemailer';

import * as emailClient from '../../notifications/email/client';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: '12345' }),
  }),
}));

describe('emailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    emailClient.resetEmailClient();
  });

  describe('init email client', () => {
    it('should initialize email client if not already initialized', () => {
      emailClient.getEmailClient();
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    });

    it('should not reinitialize email client if already initialized', () => {
      emailClient.getEmailClient();
      emailClient.getEmailClient();
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    });

    it('should not throw an error if email client initialization fails', () => {
      nodemailer.createTransport = jest.fn().mockImplementation(() => {
        throw new Error('SMTP error');
      });
      const client = emailClient.getEmailClient();

      expect(client).toBe(undefined);
    });

    it('should reset email client', () => {
      emailClient.getEmailClient();
      emailClient.resetEmailClient();
      emailClient.getEmailClient();
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
    });
  });
});
