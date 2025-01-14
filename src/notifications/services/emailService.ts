import i18n from 'i18next';

import { LoggerTags, NotificationTypes } from '../../constants';
import { createTaggedLogger } from '../../logger';
import {
  EmailNotificationPayload,
  EmailPayload,
  NewDeviceLoginEmailPayload,
} from '../../types';
import { sendEmail } from '../client/email';
import {
  getConfirmEmailTemplate,
  getNewDeviceLoginEmailTemplate,
  getResetPasswordTemplate,
} from '../templates/email';

const MODULE_NAME = 'email_service';
const logger = createTaggedLogger([LoggerTags.EMAIL, MODULE_NAME]);

export const sendActivationEmail = async (to: string, payload: EmailPayload) => {
  logger.info('Sending activation email', { to, payload });
  await i18n.changeLanguage(payload.language);
  await sendEmail({
    to,
    subject: i18n.t('email.confirmEmail.subject'),
    html: getConfirmEmailTemplate(payload),
  });
};

export const sendLoginFromNewDeviceEmail = async (
  to: string,
  payload: NewDeviceLoginEmailPayload
) => {
  logger.info('Sending login from new device email', { to, payload });
  await i18n.changeLanguage(payload.language);
  await sendEmail({
    to,
    subject: i18n.t('email.newDeviceLogin.subject'),
    html: getNewDeviceLoginEmailTemplate(payload),
  });
};

export const sendResetPasswordEmail = async (to: string, payload: EmailPayload) => {
  logger.info('Sending reset password email', { to, payload });
  await i18n.changeLanguage(payload.language);
  await sendEmail({
    to,
    subject: i18n.t('email.resetPassword.subject'),
    html: getResetPasswordTemplate(payload),
  });
};

export const sendEmailNotification = async (
  email: string,
  type: NotificationTypes,
  payload: EmailNotificationPayload
) => {
  if (!email) {
    logger.warn('No email provided for notification', { type, payload });
    return;
  }
  logger.info('Sending email notification', { email, type, payload });
  switch (type) {
    case NotificationTypes.ACCOUNT_ACTIVATION:
      return sendActivationEmail(email, payload);
    case NotificationTypes.LOGIN_FROM_NEW_DEVICE:
      return sendLoginFromNewDeviceEmail(email, payload);
    case NotificationTypes.PASSWORD_RESET:
      return sendResetPasswordEmail(email, payload);
    default:
      return;
  }
};
