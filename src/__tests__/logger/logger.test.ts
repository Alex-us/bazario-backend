import { createLogger, transports } from 'winston';
import { Loggly } from 'winston-loggly-bulk';

import {
  consoleFormat,
  initLogger,
  createTaggedLogger,
  logger,
  logglyConfig,
} from '../../logger';

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    child: jest.fn(),
    add: jest.fn(),
  })),
  transports: {
    Console: jest.fn(),
  },
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
  },
}));

jest.mock('winston-loggly-bulk', () => ({
  Loggly: jest.fn(),
}));

describe('Logger Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.LOGGLY_TOKEN = 'test-token';
    process.env.LOGGLY_SUBDOMAIN = 'test-subdomain';
  });

  it('should initialize logger with Console transport', () => {
    initLogger();

    expect(createLogger).toHaveBeenCalledWith({
      level: 'info',
      transports: [expect.any(transports.Console)],
    });
    expect(transports.Console).toHaveBeenCalledWith({ format: consoleFormat });
  });

  it('should add Loggly transport in production mode', () => {
    process.env.NODE_ENV = 'production';
    initLogger(true);

    expect(Loggly).toHaveBeenCalledWith(logglyConfig);

    expect(logger.add).toHaveBeenCalledWith(expect.any(Loggly));
  });

  it('should not add Loggly transport in non-production mode', () => {
    process.env.NODE_ENV = 'development';
    initLogger(true);

    expect(Loggly).not.toHaveBeenCalled();
    expect(logger.add).not.toHaveBeenCalled();
  });

  it('should create a tagged logger', () => {
    const mockChild = jest.fn();
    (logger.child as jest.Mock).mockImplementation(mockChild);

    const tags = ['Auth', 'Middleware'];
    const taggedLogger = createTaggedLogger(tags);

    expect(logger.child).toHaveBeenCalledWith({ tags });
    expect(taggedLogger).toBe(mockChild.mock.results[0].value);
  });

  it('should not initialize logger more than once', () => {
    initLogger(true);
    initLogger();

    expect(createLogger).toHaveBeenCalledTimes(1);
  });
});
