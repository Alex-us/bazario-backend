import jwt from 'jsonwebtoken';

import {
  decodeRefreshTokenOrThrow,
  deleteRefreshToken,
  generateRefreshTokenAndSaveToDb,
  validateRefreshTokenOrThrow,
} from '../../authorization/services/refreshTokenService';
import { ERROR_MESSAGE, REFRESH_TOKEN_EXP } from '../../constants';
import {
  deleteRefreshTokenFromDb,
  getRefreshTokenFromDb,
  saveRefreshTokenToDb,
} from '../../database/redis/refreshToken';

jest.mock('jsonwebtoken');
jest.mock('../../database/redis/refreshToken');

describe('generateRefreshTokenAndSaveToDb', () => {
  it('generates a token and saves it to the database', async () => {
    const userId = 'user123';
    const deviceId = 'device123';
    const mockToken = 'mockToken';
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);
    (saveRefreshTokenToDb as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await generateRefreshTokenAndSaveToDb(userId, deviceId);

    expect(result).toBe(mockToken);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: userId, deviceId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXP }
    );
    expect(saveRefreshTokenToDb).toHaveBeenCalledWith(userId, deviceId, mockToken);
  });

  it('throws an error if saving token to the database fails', async () => {
    const userId = 'user123';
    const deviceId = 'device123';
    (jwt.sign as jest.Mock).mockReturnValue('mockToken');
    (saveRefreshTokenToDb as jest.Mock).mockRejectedValueOnce(new Error('Save failed'));

    await expect(generateRefreshTokenAndSaveToDb(userId, deviceId)).rejects.toThrow(
      'Save failed'
    );
  });
});

describe('decodeRefreshTokenOrThrow', () => {
  it('decodes a valid token', () => {
    const token = 'validToken';
    const payload = { id: 'user123', deviceId: 'device123' };
    (jwt.verify as jest.Mock).mockReturnValue(payload);

    const result = decodeRefreshTokenOrThrow(token);

    expect(result).toEqual(payload);
    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_REFRESH_SECRET);
  });

  it('throws an error if token is invalid', () => {
    const token = 'invalidToken';
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(() => decodeRefreshTokenOrThrow(token)).toThrow('Invalid token');
  });
});

describe('validateRefreshTokenOrThrow', () => {
  it('validates a valid token', async () => {
    const userId = 'user123';
    const deviceId = 'device123';
    const token = 'validToken';
    const payload = { id: userId, deviceId };
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    (getRefreshTokenFromDb as jest.Mock).mockResolvedValueOnce(token);

    await validateRefreshTokenOrThrow(userId, deviceId, token);

    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_REFRESH_SECRET);
    expect(getRefreshTokenFromDb).toHaveBeenCalledWith(userId, deviceId);
  });

  it('throws an error if token payload is invalid', async () => {
    const userId = 'user123';
    const deviceId = 'device123';
    const token = 'invalidToken';
    (jwt.verify as jest.Mock).mockReturnValue({
      id: 'wrongId',
      deviceId: 'wrongDeviceId',
    });

    await expect(validateRefreshTokenOrThrow(userId, deviceId, token)).rejects.toThrow(
      ERROR_MESSAGE.INVALID_REFRESH_TOKEN
    );
  });

  it('throws an error if stored token does not match', async () => {
    const userId = 'user123';
    const deviceId = 'device123';
    const token = 'validToken';
    (jwt.verify as jest.Mock).mockReturnValue({ id: userId, deviceId });
    (getRefreshTokenFromDb as jest.Mock).mockResolvedValueOnce('differentToken');

    await expect(validateRefreshTokenOrThrow(userId, deviceId, token)).rejects.toThrow(
      ERROR_MESSAGE.INVALID_REFRESH_TOKEN
    );
  });
});

describe('deleteRefreshToken', () => {
  it('deletes the token from the database', async () => {
    const userId = 'user123';
    const deviceId = 'device123';
    (deleteRefreshTokenFromDb as jest.Mock).mockResolvedValueOnce(undefined);

    await deleteRefreshToken(userId, deviceId);

    expect(deleteRefreshTokenFromDb).toHaveBeenCalledWith(userId, deviceId);
  });

  it('throws an error if deletion fails', async () => {
    const userId = 'user123';
    const deviceId = 'device123';
    (deleteRefreshTokenFromDb as jest.Mock).mockRejectedValueOnce(
      new Error('Deletion failed')
    );

    await expect(deleteRefreshToken(userId, deviceId)).rejects.toThrow('Deletion failed');
  });
});
