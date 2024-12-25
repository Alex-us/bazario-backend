import nodemailer from 'nodemailer';

import { UserBlockReasons } from '../../types/models/user';
import * as emailService from '../emailService';

const to = 'test@example.com';
const token = 'login_token';
const ip = '127.0.0.1';
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: '12345' }),
  }),
}));

describe('emailService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    emailService.resetEmailClient();
  });

  it('should initialize email client if not already initialized', () => {
    emailService.getEmailClient();
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
  });

  it('should not reinitialize email client if already initialized', () => {
    emailService.getEmailClient();
    emailService.getEmailClient();
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
  });

  it('should init email client before sending activation email if not initialized', async () => {
    await emailService.sendActivationMail(to, token);
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
  });

  it('should init email client before sending new device login email if not initialized', async () => {
    await emailService.sendLoginFromNewDeviceMail(to, token, ip, userAgent);
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
  });

  it('should send activation email successfully', async () => {
    const emailClient = emailService.getEmailClient();

    await emailService.sendActivationMail(to, token);
    expect(emailClient?.sendMail).toHaveBeenCalledWith({
      from: process.env.SMTP_USER,
      to,
      subject: expect.any(String), // TODO: check the sunbject once the implementation is done
      text: expect.any(String), // TODO: check the text once the implementation is done
      html: expect.any(String), // TODO: check the html once the implementation is done
    });
  });

  it('should send login from new device email successfully', async () => {
    const emailClient = emailService.getEmailClient();

    await emailService.sendLoginFromNewDeviceMail(to, token, ip, userAgent);
    expect(emailClient?.sendMail).toHaveBeenCalledWith({
      from: process.env.SMTP_USER,
      to,
      subject: expect.any(String), // TODO: check the sunbject once the implementation is done
      text: expect.any(String), // TODO: check the text once the implementation is done
      html: expect.any(String), // TODO: check the html once the implementation is done
    });
  });

  it('should call sendActivationMail with correct arguments', async () => {
    const spy = jest
      .spyOn(emailService, 'sendActivationMail')
      .mockImplementation(() => Promise.resolve());

    emailService.getEmailClient();
    await emailService.sendEmail({
      to,
      token,
      type: UserBlockReasons.UNCONFIRMED_EMAIL,
    });
    expect(emailService.sendActivationMail).toHaveBeenCalledWith(to, token);
    spy.mockRestore();
  });

  it('should call sendLoginFromNewDeviceMail with correct arguments', async () => {
    const spy = jest
      .spyOn(emailService, 'sendLoginFromNewDeviceMail')
      .mockImplementation(() => Promise.resolve());

    emailService.getEmailClient();
    await emailService.sendEmail({
      to,
      token,
      ip,
      userAgent,
      type: UserBlockReasons.NEW_DEVICE_LOGIN,
    });
    expect(emailService.sendLoginFromNewDeviceMail).toHaveBeenCalledWith(
      to,
      token,
      ip,
      userAgent
    );
    spy.mockRestore();
  });

  it('should throw an error if new device login email sending fails', async () => {
    const client = emailService.getEmailClient();
    if (client) {
      jest.mocked(client.sendMail).mockRejectedValue(new Error('SMTP error'));

      await expect(
        emailService.sendLoginFromNewDeviceMail(to, token, ip, userAgent)
      ).rejects.toThrow('SMTP error');
    } else {
      throw new Error('Email client is not initialized');
    }
  });

  it('should throw an error if activation email sending fails', async () => {
    const client = emailService.getEmailClient();
    if (client) {
      jest.mocked(client.sendMail).mockRejectedValue(new Error('SMTP error'));

      await expect(emailService.sendActivationMail(to, token)).rejects.toThrow(
        'SMTP error'
      );
    } else {
      throw new Error('Email client is not initialized');
    }
  });

  it('should reset email client', () => {
    emailService.getEmailClient();
    emailService.resetEmailClient();
    emailService.getEmailClient();
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
  });
});
