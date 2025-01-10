import i18n from 'i18next';

import { Language } from '../../../lang/constants';
import { sendEmail } from '../client';
import {
  getConfirmEmailTemplate,
  getNewDeviceLoginEmailTemplate,
  getResetPasswordTemplate,
} from '../templates';
import { EmailPayload, NewDeviceLoginEmailPayload } from '../types';

export const sendActivationEmail = async (
  to: string,
  payload: EmailPayload,
  lang: Language
) => {
  await i18n.changeLanguage(lang);
  await sendEmail({
    to,
    subject: i18n.t('email.confirmEmail.subject'),
    html: getConfirmEmailTemplate(payload),
  });
};

export const sendLoginFromNewDeviceEmail = async (
  to: string,
  payload: NewDeviceLoginEmailPayload,
  lang: Language
) => {
  await i18n.changeLanguage(lang);
  await sendEmail({
    to,
    subject: i18n.t('email.newDeviceLogin.subject'),
    html: getNewDeviceLoginEmailTemplate(payload),
  });
};

export const sendResetPasswordEmail = async (
  to: string,
  payload: EmailPayload,
  lang: Language
) => {
  await i18n.changeLanguage(lang);
  await sendEmail({
    to,
    subject: i18n.t('email.resetPassword.subject'),
    html: getResetPasswordTemplate(payload),
  });
};
