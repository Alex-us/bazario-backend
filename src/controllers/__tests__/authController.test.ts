import { Request, Response, NextFunction } from 'express';

import { mockUserA, userAProps } from '../../__mocks__/user';
import { AUTH_ERROR_MESSAGE, AUTH_SUCCESS_MESSAGE } from '../../constants/errors';
import { BadRequestError, UnauthorizedError } from '../../errors/Error';
import getUserDTO from '../../models/User/dto';
import * as authService from '../../services/authService';
import * as tokenService from '../../services/tokenService';
import { IUser } from '../../types/models/user';
import * as authController from '../authController';

jest.mock('../../services/authService');
jest.mock('../../services/tokenService');

describe('authController', () => {
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

  describe('registerRequestHandler', () => {
    it('should register a user and return tokens', async () => {
      const mockUserData = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        user: getUserDTO(mockUserA as unknown as IUser),
      };
      jest.spyOn(authService, 'registerUser').mockResolvedValue(mockUserData);

      mockReq.body = { email: userAProps.email, password: userAProps.password };

      await authController.registerRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(authService.registerUser).toHaveBeenCalledWith(mockReq.body);
      expect(tokenService.setRefreshTokenCookie).toHaveBeenCalledWith(
        mockRes,
        mockUserData.refreshToken
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        token: mockUserData.accessToken,
        user: mockUserData.user,
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Registration failed');
      jest.spyOn(authService, 'registerUser').mockRejectedValue(error);

      await authController.registerRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('activateRequestHandler', () => {
    it('should activate a user and return success message', async () => {
      mockReq.params = { token: 'activationToken' };
      mockReq.user = { id: mockUserA._id, deviceId: mockUserA.deviceId };

      await authController.activateRequestHandler(mockReq, mockRes, mockNext);

      expect(authService.activateUser).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.params.token
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: AUTH_SUCCESS_MESSAGE.OK,
      });
    });

    it('should return error for missing activation token', async () => {
      await authController.activateRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        new BadRequestError(AUTH_ERROR_MESSAGE.EMPTY_ACTIVATION_TOKEN)
      );
    });

    it('should handle unauthorized user', async () => {
      mockReq.params.token = 'activationToken';
      mockReq.user = undefined;

      await authController.activateRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(new UnauthorizedError());
    });
  });

  describe('loginRequestHandler', () => {
    it('should login user and return tokens', async () => {
      const mockLoginResponse = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        user: getUserDTO(mockUserA as unknown as IUser),
      };
      jest.spyOn(authService, 'loginUser').mockResolvedValue(mockLoginResponse);

      mockReq.body = { email: userAProps.email, password: userAProps.password };
      mockReq.headers['user-agent'] = 'Mozilla';

      await authController.loginRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(authService.loginUser).toHaveBeenCalledWith({
        ...mockReq.body,
        userAgent: 'Mozilla',
      });
      expect(tokenService.setRefreshTokenCookie).toHaveBeenCalledWith(
        mockRes,
        mockLoginResponse.refreshToken
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        token: mockLoginResponse.accessToken,
        user: mockLoginResponse.user,
      });
    });

    it('should handle login errors', async () => {
      const error = new Error('Login failed');
      jest.spyOn(authService, 'loginUser').mockRejectedValue(error);

      await authController.loginRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshRequestHandler', () => {
    it('should refresh tokens successfully', async () => {
      const mockRefreshResponse = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      };
      jest.spyOn(tokenService, 'validateRefreshToken').mockResolvedValue(true);
      jest.spyOn(authService, 'refreshUserToken').mockResolvedValue(mockRefreshResponse);

      mockReq.cookies = { refreshToken: 'oldRefreshToken' };
      mockReq.user = { id: 'userId', deviceId: 'deviceId' };

      await authController.refreshRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(tokenService.validateRefreshToken).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.user.deviceId,
        mockReq.cookies.refreshToken
      );
      expect(authService.refreshUserToken).toHaveBeenCalledWith(
        mockReq.cookies.refreshToken,
        mockReq.user.deviceId
      );
      expect(tokenService.setRefreshTokenCookie).toHaveBeenCalledWith(
        mockRes,
        mockRefreshResponse.refreshToken
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        token: mockRefreshResponse.accessToken,
      });
    });

    it('should handle invalid refresh token', async () => {
      jest.spyOn(tokenService, 'validateRefreshToken').mockResolvedValue(false);

      mockReq.user = { id: mockUserA._id, deviceId: mockUserA.deviceId };
      mockReq.cookies = { refreshToken: 'oldRefreshToken' };

      await authController.refreshRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(new UnauthorizedError());
    });

    it('should handle case with no refresh token', async () => {
      mockReq.user = { id: mockUserA._id, deviceId: mockUserA.deviceId };

      await authController.refreshRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(new UnauthorizedError());
    });

    it('should handle refresh errors', async () => {
      const error = new Error('Refresh failed');
      jest.spyOn(tokenService, 'validateRefreshToken').mockResolvedValue(true);
      jest.spyOn(authService, 'refreshUserToken').mockRejectedValue(error);

      mockReq.cookies = { refreshToken: 'oldRefreshToken' };
      mockReq.user = { id: mockUserA._id, deviceId: mockUserA.deviceId };

      await authController.refreshRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // Test cases for logoutRequestHandler
  describe('logoutRequestHandler', () => {
    it('should logout user successfully', async () => {
      jest.spyOn(authService, 'logoutUser').mockResolvedValue();

      mockReq.user = { id: mockUserA._id, deviceId: mockUserA.deviceId };

      await authController.logoutRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(authService.logoutUser).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.user.deviceId
      );
      expect(tokenService.clearRefreshTokenCookie).toHaveBeenCalledWith(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({ message: AUTH_SUCCESS_MESSAGE.OK });
    });

    it('should handle logout errors', async () => {
      const error = new Error('Logout failed');
      jest.spyOn(authService, 'logoutUser').mockRejectedValue(error);

      mockReq.user = { id: mockUserA._id, deviceId: mockUserA.deviceId };

      await authController.logoutRequestHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
