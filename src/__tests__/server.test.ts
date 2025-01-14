import dotenv from 'dotenv';
import express from 'express';

import { ROOT_ROUTE } from '../constants';
import { connectMongo } from '../database/mongo/client';
import { connectRedis } from '../database/redis/client';
import { initTranslations } from '../lang/i18n';
import { initLogger } from '../logger';
import { notFoundMiddleware, loggerMiddleware } from '../middleware';
import { rootRouter } from '../routes';

const jsonParser = jest.fn();
const mockApp = {
  use: jest.fn(),
  listen: jest.fn(),
  Router: jest.fn(),
} as unknown as express.Application;

jest.mock('express', () => {
  const expr = jest.fn().mockReturnValue(mockApp) as unknown as typeof express;
  expr.json = jest.fn().mockReturnValue(jsonParser);
  return expr;
});

jest.mock(
  'dotenv',
  jest.fn().mockReturnValue({
    config: jest.fn(),
  })
);

jest.mock(
  '../logger',
  jest.fn().mockReturnValue({
    initLogger: jest.fn(),
    createTaggedLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
    }),
  })
);

jest.mock(
  '../database/mongo/client',
  jest.fn().mockReturnValue({
    connectMongo: jest.fn().mockResolvedValue(undefined),
  })
);

jest.mock(
  '../database/redis/client',
  jest.fn().mockReturnValue({
    connectRedis: jest.fn().mockResolvedValue(undefined),
  })
);

jest.mock(
  '../routes',
  jest.fn().mockReturnValue({
    activationRoutes: jest.fn(),
    rootRouter: jest.fn(),
  })
);

jest.mock(
  '../lang/i18n',
  jest.fn().mockReturnValue({ initTranslations: jest.fn().mockResolvedValue(undefined) })
);

jest.mock('../middleware', () =>
  jest.fn().mockReturnValue({
    loggerMiddleware: jest.fn(),
    notFoundMiddleware: jest.fn(),
  })
);

const corsResult = jest.fn();

jest.mock('cors', () => jest.fn().mockReturnValue(corsResult));

const cookieParserRes = jest.fn();
jest.mock('cookie-parser', () => jest.fn().mockReturnValue(cookieParserRes));

describe('Server Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should initialize dotenv.config', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../server');
    expect(dotenv.config).toHaveBeenCalled();
  });

  it('should init logger', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../server');
    expect(initLogger).toHaveBeenCalled();
  });

  it('should use loggerMiddleware', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../server');
    expect(mockApp.use).toHaveBeenCalledWith(loggerMiddleware);
  });

  it('should use cors parser middleware', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../server');
    expect(mockApp.use).toHaveBeenCalledWith(corsResult);
  });

  it('should use Cookie parser middleware', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../server');
    expect(mockApp.use).toHaveBeenCalledWith(cookieParserRes);
  });

  it('should use JSON parser middleware', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../server');
    expect(mockApp.use).toHaveBeenCalledWith(jsonParser);
  });

  it('should use 404 middleware', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../server');
    expect(mockApp.use).toHaveBeenCalledWith(notFoundMiddleware);
  });

  it('should use root routes', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../server');
    expect(mockApp.use).toHaveBeenCalledWith(ROOT_ROUTE, rootRouter);
  });

  it('should connect to MongoDB and Redis', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    await require('../server');
    await new Promise(process.nextTick);
    expect(initTranslations).toHaveBeenCalled();
    expect(connectMongo).toHaveBeenCalled();
    expect(connectRedis).toHaveBeenCalled();
  });
});
