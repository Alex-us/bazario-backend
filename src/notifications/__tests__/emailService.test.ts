import i18n from 'i18next';

import { Language } from '../../lang/constants';
import { sendEmail } from '../email/client';
import {
  sendActivationEmail,
  sendLoginFromNewDeviceEmail,
  sendResetPasswordEmail,
} from '../email/services/emailService';
import {
  getConfirmEmailTemplate,
  getNewDeviceLoginEmailTemplate,
  getResetPasswordTemplate,
} from '../email/templates';

jest.mock('../email/client');
jest.mock('../email/templates/confirmEmail');
jest.mock('../email/templates/newDeviceLogin');
jest.mock('../email/templates/resetPassword');
jest.mock('i18next');

describe('emailService', () => {
  const to = 'test@example.com';
  const lang = Language.UA;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends activation email successfully', async () => {
    const subject = 'Confirm Email';
    (getConfirmEmailTemplate as jest.Mock).mockReturnValue('<html>Confirm Email</html>');
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (i18n.t as unknown as jest.Mock).mockReturnValue(subject);

    const payload = {
      token: 'token',
    };

    await sendActivationEmail(to, payload, lang);

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
    (getNewDeviceLoginEmailTemplate as jest.Mock).mockReturnValue(
      '<html>New Device Login</html>'
    );
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (i18n.t as unknown as jest.Mock).mockReturnValue(subject);
    const payload = {
      ip: '1.1.1.1',
      userAgent: 'Test User Agent',
      token: 'token',
    };

    await sendLoginFromNewDeviceEmail(to, payload, lang);

    expect(i18n.changeLanguage).toHaveBeenCalledWith(lang);
    expect(i18n.t).toHaveBeenCalledWith('email.newDeviceLogin.subject');
    expect(sendEmail).toHaveBeenCalledWith({
      to,
      subject: subject,
      html: '<html>New Device Login</html>',
    });
  });

  it('sends reset password email successfully', async () => {
    const subject = 'Reset Password';
    (getResetPasswordTemplate as jest.Mock).mockReturnValue(
      '<html>Reset Password</html>'
    );
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (i18n.t as unknown as jest.Mock).mockReturnValue(subject);

    const payload = {
      token: 'token',
    };

    await sendResetPasswordEmail(to, payload, lang);

    expect(i18n.changeLanguage).toHaveBeenCalledWith(lang);
    expect(i18n.t).toHaveBeenCalledWith('email.resetPassword.subject');
    expect(sendEmail).toHaveBeenCalledWith({
      to,
      subject: subject,
      html: '<html>Reset Password</html>',
    });
  });

  it('handles error when changing language fails', async () => {
    (i18n.changeLanguage as jest.Mock).mockRejectedValue(
      new Error('Language change failed')
    );

    const payload = {
      token: 'token',
    };

    await expect(sendActivationEmail(to, payload, lang)).rejects.toThrow(
      'Language change failed'
    );
  });

  it('handles error when sending email fails', async () => {
    (getConfirmEmailTemplate as jest.Mock).mockReturnValue('<html>Confirm Email</html>');
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (sendEmail as jest.Mock).mockRejectedValue(new Error('Email send failed'));

    const payload = {
      token: 'token',
    };

    await expect(sendActivationEmail(to, payload, lang)).rejects.toThrow(
      'Email send failed'
    );
  });
});
