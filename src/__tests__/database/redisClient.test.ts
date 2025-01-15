import * as process from 'node:process';
import { createClient, RedisClientType } from 'redis';

import { REDIS_CONNECTION_TIMEOUT } from '../../constants';
import * as redisModule from '../../database/redis/client';
import { createTaggedLogger } from '../../logger';

process.env.REDIS_USER = 'default';
process.env.REDIS_PASSWORD = 'password';
process.env.REDIS_URI = 'localhost';
process.env.REDIS_PORT = '6379';

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    isOpen: false,
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    listeners: jest.fn().mockReturnValue([]),
  }),
}));

jest.mock('../../logger', () => ({
  createTaggedLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

describe('Redis Client Module', () => {
  const mockRedisClient = createClient();
  const mockLogger = createTaggedLogger(['some', 'redis']);

  beforeEach(() => {
    jest.clearAllMocks();
    redisModule.disconnectRedis();
  });

  describe('disconnectRedis', () => {
    it('should log if Redis is not initialized', async () => {
      await redisModule.disconnectRedis();

      expect(mockRedisClient.disconnect).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Redis client not connected');
    });

    it('not call disconnect if Redis is already disconnected', async () => {
      await redisModule.disconnectRedis();

      expect(mockRedisClient.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('initRedisClient', () => {
    it('throws an error if Redis client is not initialized', async () => {
      (createClient as jest.Mock).mockReturnValueOnce(undefined);
      await expect(redisModule.connectRedis()).rejects.toThrow(
        'Redis client not initialized'
      );
    });

    it('should initialize Redis client and register events', () => {
      const spy = jest.spyOn(redisModule, 'registerRedisEvents');

      redisModule.initRedisClient();

      expect(createClient).toHaveBeenCalledWith({
        username: process.env.REDIS_USER,
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_URI,
          port: Number(process.env.REDIS_PORT),
          connectTimeout: REDIS_CONNECTION_TIMEOUT,
          keepAliveInitialDelay: REDIS_CONNECTION_TIMEOUT,
        },
      });
      expect(redisModule.registerRedisEvents).toHaveBeenCalledWith(mockRedisClient);
      spy.mockRestore();
    });

    it('should not reinitialize Redis client if already initialized', () => {
      redisModule.initRedisClient();

      expect(createClient).toHaveBeenCalledTimes(0);
    });
  });

  describe('connectRedis', () => {
    it('should connect Redis successfully and log success', async () => {
      await redisModule.connectRedis();

      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should not reconnect if Redis is already connected', async () => {
      await redisModule.connectRedis();
      Object.defineProperty(mockRedisClient, 'isOpen', { value: true });
      await redisModule.connectRedis();

      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Redis client already connected');
      Object.defineProperty(mockRedisClient, 'isOpen', { value: false });
    });

    it('should log and throw an error if connection fails', async () => {
      const mockError = new Error('Connection failed');
      mockRedisClient.connect = jest.fn().mockRejectedValueOnce(mockError);

      redisModule.initRedisClient();

      await expect(redisModule.connectRedis()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error connecting to Redis', {
        error: mockError,
      });
    });

    it('should disconnect Redis successfully and log success', async () => {
      await redisModule.connectRedis();
      Object.defineProperty(mockRedisClient, 'isOpen', { value: true });

      await redisModule.disconnectRedis();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
      expect(mockRedisClient.removeAllListeners).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Redis client disconnected');
      Object.defineProperty(mockRedisClient, 'isOpen', { value: false });
    });
  });

  describe('registerRedisEvents', () => {
    it('should register events on Redis client', () => {
      redisModule.registerRedisEvents(mockRedisClient as RedisClientType);

      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'reconnecting',
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should not register events if already registered', () => {
      mockRedisClient.listeners = jest.fn().mockReturnValue([jest.fn()]);
      (mockRedisClient.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'connect') {
          mockRedisClient.listeners = jest.fn().mockReturnValue([callback]);
        }
      });

      redisModule.registerRedisEvents(mockRedisClient as RedisClientType);

      expect(mockRedisClient.on).not.toHaveBeenCalled();
    });
  });
});
