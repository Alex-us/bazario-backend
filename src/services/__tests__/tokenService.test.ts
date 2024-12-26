import { Response } from 'express';
import jwt from 'jsonwebtoken';

import { REFRESH_TOKEN_KEY_PREFIX } from '../../constants/database';
import { REFRESH_TOKEN_EXP } from '../../constants/services/token';
import { redisClient } from '../../database/redisClient';
import { findUserById } from '../authService';
import {
  generateAccessToken,
  generateRefreshToken,
  decodeAccessToken,
  decodeRefreshToken,
  validateRefreshToken,
  validateAccessTokenAndReturnUserData,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromDb,
  deleteRefreshTokenFromDb,
} from '../tokenService';

jest.mock('jsonwebtoken');
jest.mock('../authService');

jest.mock('../../database/redisClient', () => ({
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

  it('generates an access token', () => {
    (jwt.sign as jest.Mock).mockReturnValue(accessToken);
    const token = generateAccessToken(userId, deviceId);
    expect(token).toBe(accessToken);
    expect(jwt.sign).toHaveBeenCalledWith(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: expect.any(Number),
    });
  });

  it('generates a refresh token', async () => {
    (jwt.sign as jest.Mock).mockReturnValue(refreshToken);

    const token = await generateRefreshToken(userId, deviceId);
    expect(token).toBe(refreshToken);
    expect(redisClient.set).toHaveBeenCalledWith(
      `${REFRESH_TOKEN_KEY_PREFIX}${userId}:${deviceId}`,
      refreshToken,
      {
        EX: REFRESH_TOKEN_EXP / 1000,
      }
    );
  });

  it('decodes an access token', () => {
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    const result = decodeAccessToken(accessToken);
    expect(result).toEqual(payload);
    expect(jwt.verify).toHaveBeenCalledWith(accessToken, process.env.JWT_ACCESS_SECRET);
  });

  it('decodes a refresh token', () => {
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    const result = decodeRefreshToken(refreshToken);
    expect(result).toEqual(payload);
    expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
  });

  it('validates a refresh token', async () => {
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    const spy = jest.spyOn(redisClient, 'get').mockResolvedValue(refreshToken);
    const result = await validateRefreshToken(userId, deviceId, refreshToken);
    expect(result).toBe(true);
    spy.mockRestore();
  });

  it('validates an access token and returns user data', () => {
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    (findUserById as jest.Mock).mockReturnValue(true);
    const result = validateAccessTokenAndReturnUserData(accessToken);
    expect(result).toEqual(payload);
  });

  it('sets a refresh token cookie', () => {
    const res = { cookie: jest.fn() } as unknown as Response;
    setRefreshTokenCookie(res, refreshToken);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      refreshToken,
      expect.objectContaining({ httpOnly: true })
    );
  });

  it('clears a refresh token cookie', () => {
    const res = { clearCookie: jest.fn() } as unknown as Response;
    clearRefreshTokenCookie(res);
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
  });

  it('fails to decode an invalid access token', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const result = decodeAccessToken('invalid.token');
    expect(result).toBeUndefined();
  });

  it('fails to decode an invalid refresh token', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const result = decodeRefreshToken('invalid.token');
    expect(result).toBeUndefined();
  });

  it('fails to validate a refresh token with invalid payload', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'wrongId', deviceId });
    const result = await validateRefreshToken(userId, deviceId, refreshToken);
    expect(result).toBe(false);
  });

  it('fails to validate an access token with invalid payload', () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'wrongId', deviceId });
    (findUserById as jest.Mock).mockReturnValue(undefined);
    const result = validateAccessTokenAndReturnUserData(accessToken);
    expect(result).toBe(false);
  });

  it('gets a refresh token from the database', async () => {
    const spy = jest.spyOn(redisClient, 'get').mockResolvedValue(refreshToken);
    const token = await getRefreshTokenFromDb(userId, deviceId);
    expect(token).toBe(refreshToken);
    expect(redisClient.get).toHaveBeenCalledWith(
      `${REFRESH_TOKEN_KEY_PREFIX}${userId}:${deviceId}`
    );
    spy.mockRestore();
  });

  it('deletes a refresh token from the database', async () => {
    await deleteRefreshTokenFromDb(userId, deviceId);
    expect(redisClient.del).toHaveBeenCalledWith(
      `${REFRESH_TOKEN_KEY_PREFIX}${userId}:${deviceId}`
    );
  });

  it('handles error when getting refresh token from the database', async () => {
    const spy = jest
      .spyOn(redisClient, 'get')
      .mockRejectedValue(new Error('Redis error'));
    const token = await getRefreshTokenFromDb(userId, deviceId);
    expect(token).toBeUndefined();
    spy.mockRestore();
  });

  it('handles error when deleting refresh token from the database', async () => {
    const spy = jest
      .spyOn(redisClient, 'del')
      .mockRejectedValue(new Error('Redis error'));
    await deleteRefreshTokenFromDb(userId, deviceId);
    expect(redisClient.del).toHaveBeenCalledWith(
      `${REFRESH_TOKEN_KEY_PREFIX}${userId}:${deviceId}`
    );
    spy.mockRestore();
  });

  it('fails to validate access token if it is not provided', () => {
    const result = validateAccessTokenAndReturnUserData('');
    expect(result).toBe(false);
  });

  it('fails to validate access token if it is not valid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const result = validateAccessTokenAndReturnUserData('invalid.token');
    expect(result).toBe(false);
  });
});
