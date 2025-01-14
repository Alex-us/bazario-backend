import { mockUserA } from '../__mocks__/user';
import {
  Language,
  LoggerTags,
  NotificationStrategy,
  NotificationTypes,
} from '../../constants';
import { createTaggedLogger } from '../../logger';
import { sendNotification } from '../../notifications';
import { NotificationConfig } from '../../notifications/config';
import { sendDesktopNotification } from '../../notifications/services/desktopNotificationService';
import { sendEmailNotification } from '../../notifications/services/emailService';
import { sendPushNotification } from '../../notifications/services/pushService';
import { sendSmsNotification } from '../../notifications/services/smsService';
import { IUser } from '../../types';

// Mock functions
jest.mock('../../notifications/services/emailService', () => ({
  sendEmailNotification: jest.fn(),
}));
jest.mock('../../notifications/services/smsService', () => ({
  sendSmsNotification: jest.fn(),
}));
jest.mock('../../notifications/services/pushService', () => ({
  sendPushNotification: jest.fn(),
}));
jest.mock('../../notifications/services/desktopNotificationService', () => ({
  sendDesktopNotification: jest.fn(),
}));
jest.mock(
  '../../logger',
  jest.fn().mockReturnValue({
    createTaggedLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
    }),
  })
);

describe('sendNotification', () => {
  const logger = createTaggedLogger([LoggerTags.NOTIFICATIONS, 'test']);
  const mockRecipient = mockUserA as unknown as IUser;
  const mockEmailPayload = {
    token: 'some_token',
    language: Language.UA,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call sendEmailNotification for EMAIL strategy', async () => {
    await sendNotification(
      NotificationTypes.ACCOUNT_ACTIVATION,
      mockRecipient,
      mockEmailPayload
    );

    expect(sendEmailNotification).toHaveBeenCalledWith(
      mockRecipient.email,
      NotificationTypes.ACCOUNT_ACTIVATION,
      mockEmailPayload
    );
    expect(sendSmsNotification).not.toHaveBeenCalled();
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(sendDesktopNotification).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Sending notification', expect.any(Object));
  });

  it('should handle unknown strategy gracefully', async () => {
    NotificationConfig[NotificationTypes.ACCOUNT_ACTIVATION].strategies = [
      'UNKNOWN_STRATEGY' as unknown as NotificationStrategy,
    ];

    await sendNotification(
      NotificationTypes.ACCOUNT_ACTIVATION,
      mockRecipient,
      mockEmailPayload
    );

    expect(sendEmailNotification).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Unknown notification strategy', {
      strategy: 'UNKNOWN_STRATEGY',
    });
  });

  it('should call sendSmsNotification for SMS strategy', async () => {
    NotificationConfig[NotificationTypes.ACCOUNT_ACTIVATION].strategies = [
      NotificationStrategy.SMS,
    ];

    await sendNotification(
      NotificationTypes.ACCOUNT_ACTIVATION,
      mockRecipient,
      mockEmailPayload
    );

    expect(sendSmsNotification).toHaveBeenCalled();
    expect(sendEmailNotification).not.toHaveBeenCalled();
  });

  it('should call sendDesktopNotification for DESKTOP strategy', async () => {
    NotificationConfig[NotificationTypes.ACCOUNT_ACTIVATION].strategies = [
      NotificationStrategy.DESKTOP,
    ];

    await sendNotification(
      NotificationTypes.ACCOUNT_ACTIVATION,
      mockRecipient,
      mockEmailPayload
    );

    expect(sendDesktopNotification).toHaveBeenCalled();
    expect(sendEmailNotification).not.toHaveBeenCalled();
  });

  it('should call sendPushNotification for PUSH strategy', async () => {
    NotificationConfig[NotificationTypes.ACCOUNT_ACTIVATION].strategies = [
      NotificationStrategy.PUSH,
    ];

    await sendNotification(
      NotificationTypes.ACCOUNT_ACTIVATION,
      mockRecipient,
      mockEmailPayload
    );

    expect(sendPushNotification).toHaveBeenCalled();
    expect(sendEmailNotification).not.toHaveBeenCalled();
  });
});
