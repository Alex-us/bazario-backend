import { NotificationStrategy, NotificationTypes } from '../constants';

export const NotificationConfig = {
  [NotificationTypes.ACCOUNT_ACTIVATION]: {
    strategies: [NotificationStrategy.EMAIL],
  },
  [NotificationTypes.PASSWORD_RESET]: {
    strategies: [NotificationStrategy.EMAIL],
  },
  [NotificationTypes.PASSWORD_CHANGED]: {
    strategies: [NotificationStrategy.EMAIL],
  },
  [NotificationTypes.LOGIN_FROM_NEW_DEVICE]: {
    strategies: [NotificationStrategy.EMAIL],
  },
};
