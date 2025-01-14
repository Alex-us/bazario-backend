import { LoggerTags, NotificationStrategy, NotificationTypes } from '../constants';
import { createTaggedLogger } from '../logger';
import { EmailNotificationPayload, IUser } from '../types';
import { NotificationConfig } from './config';
import { sendDesktopNotification } from './services/desktopNotificationService';
import { sendEmailNotification } from './services/emailService';
import { sendPushNotification } from './services/pushService';
import { sendSmsNotification } from './services/smsService';

const MODULE_NAME = 'notifications';
const logger = createTaggedLogger([LoggerTags.NOTIFICATIONS, MODULE_NAME]);

export const sendNotification = async (
  type: NotificationTypes,
  recipient: IUser,
  payload: EmailNotificationPayload
) => {
  const strategies = NotificationConfig[type].strategies;
  logger.info('Sending notification', { type, recipient, strategies });
  for (const strategy of strategies) {
    switch (strategy) {
      case NotificationStrategy.EMAIL:
        await sendEmailNotification(recipient.email, type, payload);
        break;
      case NotificationStrategy.SMS:
        await sendSmsNotification();
        break;
      case NotificationStrategy.DESKTOP:
        await sendDesktopNotification();
        break;
      case NotificationStrategy.PUSH:
        await sendPushNotification();
        break;
      default:
        logger.error('Unknown notification strategy', { strategy });
    }
  }
};
