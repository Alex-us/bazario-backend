import { NextFunction, Request, Response } from 'express';

import { RESPONSE_SUCCESS_MESSAGE } from '../../errors/constants';
import { createTaggedLogger } from '../../logger';
import { LoggerTags } from '../../logger/constants';
import { GeneralSuccessResponse } from '../../types';
import { LoggedInUserData } from '../../types/express';
import { AUTH_COOKIE_NAME, REFRESH_TOKEN_EXP } from '../constants';
import {
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
} from '../services/authService';
import { validateRefreshTokenOrThrow } from '../services/refreshTokenService';
import {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types';

const MODULE_NAME = 'auth_controller';
const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

/**
 * Register user request handler
 * @param req - HTTP request with registration data.
 * @param res - HTTP response with token and user data.
 * @param next
 * @returns {Promise<void>}
 */
export const registerRequestHandler = async (
  req: Request<unknown, RegisterResponse, RegisterRequest>,
  res: Response<RegisterResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('Trying to register user', { ...req.body, password: '***' });
    const userData = await registerUser({ ...req.body });

    setRefreshTokenCookie(res, userData.refreshToken);

    res.json({ token: userData.accessToken, user: userData.user });
    logger.info('User registered successfully', { email: userData.user.email });
  } catch (err) {
    next(err);
  }
};

/**
 * Login user request handler
 * @param req - HTTP request with login data.
 * @param res - HTTP response with token and user data.
 * @param next
 * @returns {Promise<void>}
 */
export const loginRequestHandler = async (
  req: Request<unknown, LoginResponse, LoginRequest>,
  res: Response<LoginResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const { refreshToken, accessToken, user } = await loginUser({
      ...req.body,
      userAgent,
    });

    setRefreshTokenCookie(res, refreshToken);

    res.json({ token: accessToken, user });
  } catch (err) {
    next(err);
  }
};

/**
 * Refresh token request handler
 * @param req - HTTP request with refresh token.
 * @param res - HTTP response with new access token.
 * @param next
 * @returns {Promise<void>}
 */
export const refreshRequestHandler = async (
  req: Request<unknown, RefreshTokenResponse, RefreshTokenRequest>,
  res: Response<RefreshTokenResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    const { id, deviceId } = req.user as LoggedInUserData;

    await validateRefreshTokenOrThrow(id, deviceId, refreshToken);

    const { refreshToken: newRefreshToken, accessToken } = await refreshUserToken(
      refreshToken,
      deviceId
    );

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ token: accessToken });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout user request handler
 * @param req - HTTP request with refresh token.
 * @param res - HTTP response with success message.
 * @param next
 * @returns {Promise<void>}
 */
export const logoutRequestHandler = async (
  req: Request<unknown, GeneralSuccessResponse, LogoutRequest>,
  res: Response<GeneralSuccessResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, deviceId } = req.user as LoggedInUserData;

    await logoutUser(id, deviceId);
    res.clearCookie(AUTH_COOKIE_NAME);
    res.json({ message: RESPONSE_SUCCESS_MESSAGE.OK });
  } catch (err) {
    next(err);
  }
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie(AUTH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXP * 1000,
  });
};
