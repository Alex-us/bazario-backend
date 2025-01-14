import nodemailer from 'nodemailer';

import * as emailClient from '../../notifications/client/email';
import { sendEmail } from '../../notifications/client/email';

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

  describe('sendEmail', () => {
    it('should send an email with the provided properties', async () => {
      const props = { to: 'test@example.com', subject: 'Test', html: 'Test email' };
      const sendMailMock = jest.fn().mockResolvedValueOnce({});
      (nodemailer.createTransport as jest.Mock).mockReturnValueOnce({
        sendMail: sendMailMock,
      });

      await sendEmail(props);

      expect(sendMailMock).toHaveBeenCalledWith(props);
    });

    it('should throw an error if email client is not initialized', async () => {
      jest.spyOn(nodemailer, 'createTransport').mockImplementationOnce(() => {
        throw new Error('Initialization error');
      });

      await expect(
        sendEmail({ to: 'test@example.com', subject: 'Test', html: 'Test email' })
      ).rejects.toThrow('Email client is not initialized');
    });

    it('should throw an error if sendMail fails', async () => {
      const props = { to: 'test@example.com', subject: 'Test', html: 'Test email' };
      const sendMailMock = jest.fn().mockRejectedValueOnce(new Error('SendMail error'));
      (nodemailer.createTransport as jest.Mock).mockReturnValueOnce({
        sendMail: sendMailMock,
      });

      await expect(sendEmail(props)).rejects.toThrow('SendMail error');
    });
  });
});
