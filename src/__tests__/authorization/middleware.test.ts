import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { mockUserA } from '../__mocks__/user';
import * as userService from '../../account/services/userService';
import { authMiddleware } from '../../authorization/middleware';
import { UnauthorizedError } from '../../errors';

jest.mock('../../account/services/userService', () => {
  return {
    findUserByIdOrThrow: jest.fn(),
  };
});

const userPayload = {
  id: mockUserA._id,
  deviceId: mockUserA.deviceId,
};

process.env.JWT_ACCESS_SECRET = 'some_secret';

describe('middleware', () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
    } as Request;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('authMiddleware', () => {
    it('should call next if authorization header is valid', async () => {
      jest
        .spyOn(userService, 'findUserByIdOrThrow')
        .mockResolvedValueOnce(mockUserA as never);
      const token = jwt.sign(userPayload, process.env.JWT_ACCESS_SECRET as string, {
        expiresIn: 2000,
      });
      mockRequest.headers.authorization = `Bearer ${token}`;

      await authMiddleware(mockRequest, mockResponse, nextFunction);

      expect(mockRequest.user).toEqual({
        id: mockUserA._id.toString(),
        deviceId: mockUserA.deviceId,
      });

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should return 401 if authorization header is missing', async () => {
      await authMiddleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(new UnauthorizedError());
    });

    it('should return 401 if authorization header has no Bearer', async () => {
      mockRequest.headers.authorization = 'InvalidToken';

      await authMiddleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(new UnauthorizedError());
    });

    it('should return 401 if token is expired', async () => {
      jest
        .spyOn(userService, 'findUserByIdOrThrow')
        .mockResolvedValueOnce(mockUserA as never);

      const token = jwt.sign(userPayload, process.env.JWT_ACCESS_SECRET as string, {
        expiresIn: 1,
      });
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      mockRequest.headers.authorization = `Bearer ${token}`;

      await authMiddleware(mockRequest, mockResponse, nextFunction);

      jest.clearAllTimers();
      jest.useRealTimers();

      expect(nextFunction).toHaveBeenCalledWith(new UnauthorizedError());
    });
  });
});
