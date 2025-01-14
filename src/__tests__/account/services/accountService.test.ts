import {
  requestPasswordReset,
  resetPassword,
  activateAccount,
} from '../../../account/services/accountService';
import {
  generateResetPasswordToken,
  findResetPasswordTokenOrThrow,
  deleteResetPasswordToken,
} from '../../../account/services/resetPasswordTokenService';
import {
  findUserByEmailOrThrow,
  updateUserByEmailOrThrow,
  setUserActiveOrThrow,
} from '../../../account/services/userService';
import { UnauthorizedError } from '../../../errors';
import { ActivationTokenError } from '../../../errors/token';
import { sendResetPasswordEmail } from '../../../notifications/services/emailService';

jest.mock('../../../account/services/userService');
jest.mock('../../../account/services/resetPasswordTokenService');
jest.mock('../../../notifications/services/emailService');

describe('accountService', () => {
  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const email = 'test@example.com';
      const user = { id: 'user-id', email, language: 'en' };
      (findUserByEmailOrThrow as jest.Mock).mockResolvedValue(user);
      (generateResetPasswordToken as jest.Mock).mockResolvedValue('reset-token');

      await requestPasswordReset(email);

      expect(findUserByEmailOrThrow).toHaveBeenCalledWith(email);
      expect(generateResetPasswordToken).toHaveBeenCalledWith(user.id);
      expect(sendResetPasswordEmail).toHaveBeenCalledWith(email, {
        token: 'reset-token',
        language: 'en',
      });
    });

    it('should throw an error if user is not found', async () => {
      const email = 'test@example.com';
      (findUserByEmailOrThrow as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      await expect(requestPasswordReset(email)).rejects.toThrow('User not found');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const email = 'test@example.com';
      const token = 'reset-token';
      const password = 'new-password';
      (findResetPasswordTokenOrThrow as jest.Mock).mockResolvedValue(true);

      await resetPassword(email, token, password);

      expect(findResetPasswordTokenOrThrow).toHaveBeenCalledWith(email, token);
      expect(updateUserByEmailOrThrow).toHaveBeenCalledWith(email, { password });
      expect(deleteResetPasswordToken).toHaveBeenCalledWith(email);
    });

    it('should throw an error if token is invalid', async () => {
      const email = 'test@example.com';
      const token = 'invalid-token';
      const password = 'new-password';
      (findResetPasswordTokenOrThrow as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );

      await expect(resetPassword(email, token, password)).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('activateAccount', () => {
    it('should activate account successfully', async () => {
      const userId = 'user-id';
      const token = 'activation-token';

      await activateAccount(userId, token);

      expect(setUserActiveOrThrow).toHaveBeenCalledWith(userId, token);
    });

    it('should throw an error if token is missing', async () => {
      const userId = 'user-id';

      await expect(activateAccount(userId)).rejects.toThrow(ActivationTokenError);
    });

    it('should throw an error if userId is missing', async () => {
      const token = 'activation-token';

      await expect(activateAccount('', token)).rejects.toThrow(UnauthorizedError);
    });
  });
});
