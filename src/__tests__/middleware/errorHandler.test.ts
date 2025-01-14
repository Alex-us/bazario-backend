import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../../errors';
import { TokenError } from '../../errors/token';
import { UserError } from '../../errors/user';
import { createTaggedLogger } from '../../logger';
import { errorMiddleware, notFoundMiddleware } from '../../middleware';

jest.mock('../../logger', () => ({
  createTaggedLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

describe('errorMiddleware', () => {
  const mockLogger = createTaggedLogger(['some', 'authHandler']);

  const mockRequest = (): Partial<Request> => ({
    method: 'GET',
    originalUrl: '/test-url',
  });

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    (createTaggedLogger as jest.Mock).mockReturnValue(mockLogger);
  });

  it('should log the error and return ApiError response', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const apiError = new ApiError(400, 'Test ApiError');

    errorMiddleware(apiError, req, res, mockNext);

    expect(mockLogger.error).toHaveBeenCalledWith('Express error', {
      method: 'GET',
      url: '/test-url',
      stack: apiError.stack,
      error: apiError,
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Test ApiError' });
  });

  it('should log the error and return generic error response in production', () => {
    process.env.NODE_ENV = 'production';

    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const genericError = new Error('Test Error');

    errorMiddleware(genericError, req, res, mockNext);

    expect(mockLogger.error).toHaveBeenCalledWith('Express error', {
      method: 'GET',
      url: '/test-url',
      stack: genericError.stack,
      error: genericError,
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });

    process.env.NODE_ENV = 'test'; // Reset NODE_ENV
  });

  it('should log the error and return detailed error response in non-production', () => {
    process.env.NODE_ENV = 'development';

    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const genericError = new Error('Test Error');

    errorMiddleware(genericError, req, res, mockNext);

    expect(mockLogger.error).toHaveBeenCalledWith('Express error', {
      method: 'GET',
      url: '/test-url',
      stack: genericError.stack,
      error: genericError,
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Test Error',
      stack: genericError.stack,
    });

    process.env.NODE_ENV = 'test'; // Reset NODE_ENV
  });

  it('should handle undefined stack gracefully', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const errorWithoutStack = new Error('Test Error');
    errorWithoutStack.stack = undefined;

    errorMiddleware(errorWithoutStack, req, res, mockNext);

    expect(mockLogger.error).toHaveBeenCalledWith('Express error', {
      method: 'GET',
      url: '/test-url',
      stack: undefined,
      error: errorWithoutStack,
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Test Error',
      stack: undefined,
    });
  });

  it('returns 400 status code for UserError', () => {
    const userError = new UserError('User error occurred');
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;

    errorMiddleware(userError, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User error occurred' });
  });

  it('returns 400 status code for Token', () => {
    const userError = new TokenError('Token error occurred');
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;

    errorMiddleware(userError, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token error occurred' });
  });

  describe('notFoundMiddleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    it('returns 404 status code and Not Found message', () => {
      notFoundMiddleware(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Not Found');
    });
  });
});
