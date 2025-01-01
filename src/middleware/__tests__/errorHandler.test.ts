import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../../errors';
import { createTaggedLogger } from '../../logger';
import errorMiddleware from '../errorHandler';

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
});
