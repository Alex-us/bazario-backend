import { Request, Response, NextFunction } from 'express';

import { mockUserA, userAProps } from '../__mocks__/user';
import getUserDTO from '../../account/dto/user';
import {
  registerRequestHandler,
  loginRequestHandler,
  refreshRequestHandler,
  logoutRequestHandler,
} from '../../authorization/controllers/authController';
import * as authService from '../../authorization/services/authService';
import * as tokenService from '../../authorization/services/refreshTokenService';
import {
  RESPONSE_SUCCESS_MESSAGE,
  AUTH_COOKIE_NAME,
  REFRESH_TOKEN_EXP,
} from '../../constants';
import { IUser } from '../../types';

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

      await registerRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.registerUser).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        mockUserData.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_EXP * 1000,
        }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        token: mockUserData.accessToken,
        user: mockUserData.user,
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Registration failed');
      jest.spyOn(authService, 'registerUser').mockRejectedValue(error);

      await registerRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
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

      await loginRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.loginUser).toHaveBeenCalledWith({
        ...mockReq.body,
        userAgent: 'Mozilla',
      });
      expect(mockRes.cookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        mockLoginResponse.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_EXP * 1000,
        }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        token: mockLoginResponse.accessToken,
        user: mockLoginResponse.user,
      });
    });

    it('should handle login errors', async () => {
      const error = new Error('Login failed');
      jest.spyOn(authService, 'loginUser').mockRejectedValue(error);

      await loginRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshRequestHandler', () => {
    it('should refresh tokens successfully', async () => {
      const mockRefreshResponse = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      };
      jest.spyOn(tokenService, 'validateRefreshTokenOrThrow').mockResolvedValue();
      jest.spyOn(authService, 'refreshUserToken').mockResolvedValue(mockRefreshResponse);

      mockReq.cookies = { refreshToken: 'oldRefreshToken' };
      mockReq.user = { id: 'userId', deviceId: 'deviceId' };

      await refreshRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(tokenService.validateRefreshTokenOrThrow).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.user.deviceId,
        mockReq.cookies.refreshToken
      );
      expect(authService.refreshUserToken).toHaveBeenCalledWith(
        mockReq.cookies.refreshToken,
        mockReq.user.deviceId
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        mockRefreshResponse.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_EXP * 1000,
        }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        token: mockRefreshResponse.accessToken,
      });
    });

    it('should handle invalid refresh token', async () => {
      const spy = jest
        .spyOn(tokenService, 'validateRefreshTokenOrThrow')
        .mockRejectedValueOnce('Error');

      mockReq.user = { id: mockUserA.toString(), deviceId: mockUserA.deviceId };
      mockReq.cookies = { refreshToken: 'oldRefreshToken' };

      await refreshRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith('Error');
      spy.mockRestore();
    });

    it('should handle refresh errors', async () => {
      const error = new Error('Refresh failed');
      jest.spyOn(tokenService, 'validateRefreshTokenOrThrow').mockResolvedValue();
      jest.spyOn(authService, 'refreshUserToken').mockRejectedValue(error);

      mockReq.cookies = { refreshToken: 'oldRefreshToken' };
      mockReq.user = { id: mockUserA._id.toString(), deviceId: mockUserA.deviceId };

      await refreshRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logoutRequestHandler', () => {
    it('should logout user successfully', async () => {
      jest.spyOn(authService, 'logoutUser').mockResolvedValue();

      mockReq.user = { id: mockUserA._id.toString(), deviceId: mockUserA.deviceId };

      await logoutRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(authService.logoutUser).toHaveBeenCalledWith(
        mockReq.user.id,
        mockReq.user.deviceId
      );
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockRes.json).toHaveBeenCalledWith({ message: RESPONSE_SUCCESS_MESSAGE.OK });
    });

    it('should handle logout errors', async () => {
      const error = new Error('Logout failed');
      jest.spyOn(authService, 'logoutUser').mockRejectedValue(error);

      mockReq.user = { id: mockUserA._id.toString(), deviceId: mockUserA.deviceId };

      await logoutRequestHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
