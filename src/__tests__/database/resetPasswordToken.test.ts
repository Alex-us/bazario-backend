import {
  RESET_PASSWORD_TOKEN_EXP,
  RESET_PASSWORD_TOKEN_KEY_PREFIX,
} from '../../constants';
import { redisClient } from '../../database/redis/client';
import {
  deleteResetPasswordTokenFromDB,
  getResetPasswordToken,
  getResetPasswordTokenRedisKey,
  saveResetPasswordToken,
} from '../../database/redis/resetPasswordToken';

jest.mock(
  '../../database/redis/client',
  jest.fn().mockReturnValue({
    redisClient: {
      get: jest.fn(),
      del: jest.fn(),
      set: jest.fn(),
    },
  })
);

describe('resetPasswordToken', () => {
  it('should get redis key for reset password token', () => {
    const email = 'vasya@gmail.com';
    const key = `${RESET_PASSWORD_TOKEN_KEY_PREFIX}${email}`;
    expect(getResetPasswordTokenRedisKey(email)).toBe(key);
  });

  describe('deleteResetPasswordTokenFromDB', () => {
    it('should delete the reset password token for the given email', async () => {
      const email = 'test@example.com';
      const key = getResetPasswordTokenRedisKey(email);

      await deleteResetPasswordTokenFromDB(email);

      expect(redisClient.del).toHaveBeenCalledWith(key);
    });

    it('should handle non-existing keys gracefully', async () => {
      const email = 'nonexistent@example.com';
      const key = getResetPasswordTokenRedisKey(email);

      (redisClient.del as jest.Mock).mockResolvedValueOnce(0);

      await deleteResetPasswordTokenFromDB(email);

      expect(redisClient.del).toHaveBeenCalledWith(key);
    });

    it('should throw an error if redisClient.del fails', async () => {
      const email = 'error@example.com';

      (redisClient.del as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await expect(deleteResetPasswordTokenFromDB(email)).rejects.toThrow('Redis error');
    });
  });

  describe('saveResetPasswordToken', () => {
    it('should save the reset password token with the correct key and expiration', async () => {
      const email = 'test@example.com';
      const token = 'testToken';
      const key = getResetPasswordTokenRedisKey(email);

      await saveResetPasswordToken(email, token);

      expect(redisClient.set).toHaveBeenCalledWith(key, token, {
        EX: RESET_PASSWORD_TOKEN_EXP,
      });
    });

    it('should handle redisClient.set failure', async () => {
      const email = 'error@example.com';
      const token = 'errorToken';

      (redisClient.set as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await expect(saveResetPasswordToken(email, token)).rejects.toThrow('Redis error');
    });
  });

  describe('getResetPasswordToken', () => {
    it('should return the reset password token for the given email', async () => {
      const email = 'test@example.com';
      const token = 'testToken';
      const key = getResetPasswordTokenRedisKey(email);

      (redisClient.get as jest.Mock).mockResolvedValueOnce(token);

      const result = await getResetPasswordToken(email);

      expect(result).toBe(token);
      expect(redisClient.get).toHaveBeenCalledWith(key);
    });

    it('should return null if no token exists for the given email', async () => {
      const email = 'nonexistent@example.com';
      const key = getResetPasswordTokenRedisKey(email);

      (redisClient.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await getResetPasswordToken(email);

      expect(result).toBeNull();
      expect(redisClient.get).toHaveBeenCalledWith(key);
    });

    it('should throw an error if redisClient.get fails', async () => {
      const email = 'error@example.com';

      (redisClient.get as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await expect(getResetPasswordToken(email)).rejects.toThrow('Redis error');
    });
  });
});
