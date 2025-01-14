import { Request, Response } from 'express';

import { LoggerTags } from '../../constants';
import { createTaggedLogger } from '../../logger';
import { loggerMiddleware, formatFn, options } from '../../middleware';

jest.mock('morgan', () => jest.fn(() => jest.fn()));

jest.mock('../../logger', () => ({
  createTaggedLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

describe('loggerMiddleware', () => {
  const mockReq = {
    method: 'GET',
    url: '/api/test',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'MockAgent',
    },
  } as unknown as Request;

  const mockRes = {
    statusCode: 200,
    getHeader: jest.fn((header: string) => {
      if (header === 'content-length') return '123';
      return null;
    }),
  } as unknown as Response;

  const mockTokens = {
    method: jest.fn(req => req.method),
    url: jest.fn(req => req.url),
    status: jest.fn((_, res) => res.statusCode.toString()),
    res: jest.fn((_, res, field) => res.getHeader(field)),
    'response-time': jest.fn(() => '10'),
    'user-agent': jest.fn(req => req.headers['user-agent']),
  };

  const logger = createTaggedLogger([LoggerTags.EXPRESS, 'morgan']);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format the log message correctly', () => {
    const result = formatFn(mockTokens, mockReq, mockRes);

    expect(result).toBe(
      JSON.stringify({
        method: 'GET',
        url: '/api/test',
        status: '200',
        contentLength: '123',
        responseTime: '10 ms',
        userAgent: 'MockAgent',
        ip: '127.0.0.1',
      })
    );

    expect(mockTokens.method).toHaveBeenCalledWith(mockReq, mockRes);
    expect(mockTokens.url).toHaveBeenCalledWith(mockReq, mockRes);
    expect(mockTokens.status).toHaveBeenCalledWith(mockReq, mockRes);
    expect(mockTokens.res).toHaveBeenCalledWith(mockReq, mockRes, 'content-length');
    expect(mockTokens['response-time']).toHaveBeenCalledWith(mockReq, mockRes);
    expect(mockTokens['user-agent']).toHaveBeenCalledWith(mockReq, mockRes);
  });

  it('should write log message to logger via options.stream.write', () => {
    const message = 'Test log message';
    options.stream.write(message);

    expect(logger.info).toHaveBeenCalledWith(message);
  });

  it('should export the initialized morgan logger', () => {
    expect(loggerMiddleware).toBeDefined();
  });
});
