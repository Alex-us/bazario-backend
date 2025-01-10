import { mockUserA } from '../../__mocks__/user';
import { REFRESH_TOKEN_KEY_PREFIX } from '../constants';
import { redisClient } from '../redis/client';
import { deleteRefreshTokenFromDb, getRefreshTokenFromDb } from '../redis/refreshToken';

const { _id, deviceId } = mockUserA;
const userId = _id.toString();

jest.mock(
  '../redis/client',
  jest.fn().mockReturnValue({
    redisClient: {
      get: jest.fn(),
      del: jest.fn(),
    },
  })
);

describe('refreshToken', () => {
  it('gets a refresh token from the database', async () => {
    const refreshToken = 'refresh.token';

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
});
