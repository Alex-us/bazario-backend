import jwt from 'jsonwebtoken';

import { findUserByIdOrThrow } from '../../account/services/userService';
import {
  generateAccessToken,
  decodeAccessTokenOrThrow,
  validateAccessTokenOrThrow,
} from '../../authorization/services/accessTokenService';
import {
  generateRefreshTokenAndSaveToDb,
  decodeRefreshTokenOrThrow,
  validateRefreshTokenOrThrow,
} from '../../authorization/services/refreshTokenService';
import {
  REFRESH_TOKEN_KEY_PREFIX,
  ERROR_MESSAGE,
  REFRESH_TOKEN_EXP,
} from '../../constants';
import { redisClient } from '../../database/redis/client';
import { AccessTokenError, RefreshTokenError } from '../../errors/token';

jest.mock('jsonwebtoken');
jest.mock('../../account/services/accountService');
jest.mock('../../account/services/userService');

jest.mock('../../database/redis/client', () => ({
  connectRedis: jest.fn(),
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

describe('Token Service', () => {
  const userId = 'user123';
  const deviceId = 'device123';
  const accessToken = 'access.token';
  const refreshToken = 'refresh.token';
  const payload = { id: userId, deviceId };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Access Token', () => {
    it('generates an access token', () => {
      (jwt.sign as jest.Mock).mockReturnValue(accessToken);
      const token = generateAccessToken(userId, deviceId);
      expect(token).toBe(accessToken);
      expect(jwt.sign).toHaveBeenCalledWith(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: expect.any(Number),
      });
    });

    it('decodes an access token', () => {
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      const result = decodeAccessTokenOrThrow(accessToken);
      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(accessToken, process.env.JWT_ACCESS_SECRET);
    });

    it('validates an access token and returns user data', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (findUserByIdOrThrow as jest.Mock).mockReturnValue(true);
      const result = await validateAccessTokenOrThrow(accessToken);
      expect(result).toEqual(payload);
    });

    it('fails to decode an invalid access token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      expect(() => decodeAccessTokenOrThrow('invalid.token')).toThrow(
        new AccessTokenError('Invalid token')
      );
    });

    it('fails to validate an access token with invalid payload', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'wrongId' });
      await expect(validateAccessTokenOrThrow(accessToken)).rejects.toThrow(
        new AccessTokenError(ERROR_MESSAGE.INVALID_ACCESS_TOKEN)
      );
    });

    it('fails to validate access token if it is not provided', async () => {
      const result = await validateAccessTokenOrThrow('');
      expect(result).toBeFalsy();
    });

    it('fails to validate access token if it is not valid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await expect(validateAccessTokenOrThrow('invalid.token')).rejects.toThrow(
        new Error('Invalid token')
      );
    });
  });

  describe('Refresh Token', () => {
    it('generates a refresh token', async () => {
      (jwt.sign as jest.Mock).mockReturnValue(refreshToken);

      const token = await generateRefreshTokenAndSaveToDb(userId, deviceId);
      expect(token).toBe(refreshToken);
      expect(redisClient.set).toHaveBeenCalledWith(
        `${REFRESH_TOKEN_KEY_PREFIX}${userId}:${deviceId}`,
        refreshToken,
        {
          EX: REFRESH_TOKEN_EXP,
        }
      );
    });

    it('decodes a refresh token', () => {
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      const result = decodeRefreshTokenOrThrow(refreshToken);
      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
    });

    it('validates a refresh token', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      const spy = jest.spyOn(redisClient, 'get').mockResolvedValue(refreshToken);

      expect(() =>
        validateRefreshTokenOrThrow(userId, deviceId, refreshToken)
      ).not.toThrow();
      spy.mockRestore();
    });

    it('fails to decode an invalid refresh token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      expect(() => decodeRefreshTokenOrThrow('invalid.token')).toThrow(
        new RefreshTokenError('Invalid token')
      );
    });

    it('fails to validate a refresh token with invalid payload', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'wrongId', deviceId });
      await expect(
        validateRefreshTokenOrThrow(userId, deviceId, refreshToken)
      ).rejects.toThrow(new RefreshTokenError(ERROR_MESSAGE.INVALID_REFRESH_TOKEN));
    });
  });
});
