import { NextFunction, Request, Response } from 'express';

import { mockUserA } from '../../__mocks__/user';
import { activateRequestHandler } from '../../account/controllers/accountController';
import { activateAccount } from '../../account/services/accountService';
import { UnauthorizedError } from '../../errors';
import { RESPONSE_SUCCESS_MESSAGE } from '../../errors/constants';

jest.mock(
  '../../account/services/accountService',
  jest.fn().mockReturnValue({
    activateAccount: jest.fn(),
  })
);

describe('accountController', () => {
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      cookies: {},
      headers: {},
      user: undefined,
    } as Request;
    mockRes = {
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;
    mockNext = jest.fn();
    jest.clearAllMocks();
  });
  describe('activateRequestHandler', () => {
    it('should activate a user and return success message', async () => {
      mockReq.body = { token: 'activationToken' };
      mockReq.user = { id: mockUserA._id.toString(), deviceId: mockUserA.deviceId };

      await activateRequestHandler(mockReq, mockRes, mockNext);

      expect(activateAccount).toHaveBeenCalledWith(mockReq.user.id, mockReq.body.token);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: RESPONSE_SUCCESS_MESSAGE.OK,
      });
    });

    it('should return error for missing activation token', async () => {
      await activateRequestHandler(mockReq as Request, mockRes as Response, mockNext);
      mockReq.user = { id: mockUserA._id.toString(), deviceId: mockUserA.deviceId };

      expect(mockNext).toHaveBeenCalledWith(new UnauthorizedError());
    });

    it('should handle unauthorized user', async () => {
      mockReq.body.token = 'activationToken';
      mockReq.user = undefined;

      await activateRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new UnauthorizedError());
    });
  });
});
