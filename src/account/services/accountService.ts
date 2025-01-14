import { ERROR_MESSAGE, LoggerTags } from '../../constants';
import { UnauthorizedError } from '../../errors';
import { ActivationTokenError } from '../../errors/token';
import { createTaggedLogger } from '../../logger';
import { sendResetPasswordEmail } from '../../notifications/services/emailService';
import {
  deleteResetPasswordToken,
  findResetPasswordTokenOrThrow,
  generateResetPasswordToken,
} from './resetPasswordTokenService';
import {
  findUserByEmailOrThrow,
  updateUserByEmailOrThrow,
  setUserActiveOrThrow,
} from './userService';

const MODULE_NAME = 'account_service';

const logger = createTaggedLogger([LoggerTags.ACCOUNT, MODULE_NAME]);

export const requestPasswordReset = async (email: string) => {
  logger.info('Requesting password reset', { email });
  const user = await findUserByEmailOrThrow(email);

  const token = await generateResetPasswordToken(user.id);
  await sendResetPasswordEmail(user.email, { token, language: user.language });
  logger.info('Password reset requested successfully', { email });
};

export const resetPassword = async (email: string, token: string, password: string) => {
  await findResetPasswordTokenOrThrow(email, token);
  await updateUserByEmailOrThrow(email, { password });
  await deleteResetPasswordToken(email);
};

export const activateAccount = async (userId: string, token?: string) => {
  if (!token) {
    logger.error('Empty activation token');
    throw new ActivationTokenError(ERROR_MESSAGE.EMPTY_ACTIVATION_TOKEN);
  }

  if (!userId) {
    logger.error('No authenticated user data found');
    throw new UnauthorizedError();
  }

  await setUserActiveOrThrow(userId, token);
};
