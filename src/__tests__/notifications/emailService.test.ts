import i18n from 'i18next';

import { Language, NotificationTypes } from '../../constants';
import { sendEmail } from '../../notifications/client/email';
import * as emailService from '../../notifications/services/emailService';
import {
  getConfirmEmailTemplate,
  getNewDeviceLoginEmailTemplate,
  getResetPasswordTemplate,
} from '../../notifications/templates/email';

jest.mock('../../notifications/client/email');
jest.mock('../../notifications/templates/email/confirmEmail');
jest.mock('../../notifications/templates/email/newDeviceLogin');
jest.mock('../../notifications/templates/email/resetPassword');
jest.mock('i18next');

describe('emailService', () => {
  const to = 'test@example.com';
  const lang = Language.UA;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends activation email successfully', async () => {
    const subject = 'Confirm Email';
    (getConfirmEmailTemplate as jest.Mock).mockReturnValue(subject);
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (i18n.t as unknown as jest.Mock).mockReturnValue(subject);

    const payload = {
      token: 'token',
      language: lang,
    };

    await emailService.sendActivationEmail(to, payload);

    expect(i18n.changeLanguage).toHaveBeenCalledWith(lang);
    expect(i18n.t).toHaveBeenCalledWith('email.confirmEmail.subject');
    expect(sendEmail).toHaveBeenCalledWith({
      to,
      subject: subject,
      html: '<html>Confirm Email</html>',
    });
  });

  it('sends login from new device email successfully', async () => {
    const subject = 'New Device Login';
    (getNewDeviceLoginEmailTemplate as jest.Mock).mockReturnValue(subject);
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (i18n.t as unknown as jest.Mock).mockReturnValue(subject);
    const payload = {
      ip: '1.1.1.1',
      userAgent: 'Test User Agent',
      token: 'token',
      language: lang,
    };

    await emailService.sendLoginFromNewDeviceEmail(to, payload);

    expect(i18n.changeLanguage).toHaveBeenCalledWith(lang);
    expect(i18n.t).toHaveBeenCalledWith('email.newDeviceLogin.subject');
    expect(sendEmail).toHaveBeenCalledWith({
      to,
      subject: subject,
      html: subject,
    });
  });

  it('sends reset password email successfully', async () => {
    const subject = 'Reset Password';
    (getResetPasswordTemplate as jest.Mock).mockReturnValue(subject);
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (i18n.t as unknown as jest.Mock).mockReturnValue(subject);

    const payload = {
      token: 'token',
      language: lang,
    };

    await emailService.sendResetPasswordEmail(to, payload);

    expect(i18n.changeLanguage).toHaveBeenCalledWith(lang);
    expect(i18n.t).toHaveBeenCalledWith('email.resetPassword.subject');
    expect(sendEmail).toHaveBeenCalledWith({
      to,
      subject: subject,
      html: subject,
    });
  });

  it('handles error when changing language fails', async () => {
    (i18n.changeLanguage as jest.Mock).mockRejectedValue(
      new Error('Language change failed')
    );

    const payload = {
      token: 'token',
      language: lang,
    };

    await expect(emailService.sendActivationEmail(to, payload)).rejects.toThrow(
      'Language change failed'
    );
  });

  it('handles error when sending email fails', async () => {
    (getConfirmEmailTemplate as jest.Mock).mockReturnValue('<html>Confirm Email</html>');
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (sendEmail as jest.Mock).mockRejectedValue(new Error('Email send failed'));

    const payload = {
      token: 'token',
      language: lang,
    };

    await expect(emailService.sendActivationEmail(to, payload)).rejects.toThrow(
      'Email send failed'
    );
  });

  describe('sendEmailNotification', () => {
    const email = 'test@example.com';
    const payload = { token: 'token', language: Language.UA };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('sends activation email when type is ACCOUNT_ACTIVATION', async () => {
      const spy = jest
        .spyOn(emailService, 'sendActivationEmail')
        .mockResolvedValueOnce(undefined);
      await emailService.sendEmailNotification(
        email,
        NotificationTypes.ACCOUNT_ACTIVATION,
        payload
      );

      expect(emailService.sendActivationEmail).toHaveBeenCalledWith(email, payload);
      spy.mockRestore();
    });

    it('sends login from new device email when type is LOGIN_FROM_NEW_DEVICE', async () => {
      const spy = jest
        .spyOn(emailService, 'sendLoginFromNewDeviceEmail')
        .mockResolvedValueOnce(undefined);
      await emailService.sendEmailNotification(
        email,
        NotificationTypes.LOGIN_FROM_NEW_DEVICE,
        payload
      );

      expect(emailService.sendLoginFromNewDeviceEmail).toHaveBeenCalledWith(
        email,
        payload
      );
      spy.mockRestore();
    });

    it('sends reset password email when type is PASSWORD_RESET', async () => {
      const spy = jest
        .spyOn(emailService, 'sendResetPasswordEmail')
        .mockResolvedValueOnce(undefined);
      await emailService.sendEmailNotification(
        email,
        NotificationTypes.PASSWORD_RESET,
        payload
      );

      expect(emailService.sendResetPasswordEmail).toHaveBeenCalledWith(email, payload);
      spy.mockRestore();
    });

    it('does nothing when email is empty', async () => {
      const spyA = jest.spyOn(emailService, 'sendActivationEmail');
      const spyB = jest.spyOn(emailService, 'sendLoginFromNewDeviceEmail');
      const spyC = jest.spyOn(emailService, 'sendResetPasswordEmail');
      await emailService.sendEmailNotification(
        '',
        NotificationTypes.ACCOUNT_ACTIVATION,
        payload
      );

      expect(emailService.sendActivationEmail).not.toHaveBeenCalled();
      expect(emailService.sendLoginFromNewDeviceEmail).not.toHaveBeenCalled();
      expect(emailService.sendResetPasswordEmail).not.toHaveBeenCalled();

      spyA.mockRestore();
      spyB.mockRestore();
      spyC.mockRestore();
    });

    it('does nothing when type is unknown', async () => {
      const spyA = jest.spyOn(emailService, 'sendActivationEmail');
      const spyB = jest.spyOn(emailService, 'sendLoginFromNewDeviceEmail');
      const spyC = jest.spyOn(emailService, 'sendResetPasswordEmail');

      await emailService.sendEmailNotification(
        email,
        'UNKNOWN_TYPE' as NotificationTypes,
        payload
      );

      expect(emailService.sendActivationEmail).not.toHaveBeenCalled();
      expect(emailService.sendLoginFromNewDeviceEmail).not.toHaveBeenCalled();
      expect(emailService.sendResetPasswordEmail).not.toHaveBeenCalled();

      spyA.mockRestore();
      spyB.mockRestore();
      spyC.mockRestore();
    });
  });
});
