import { NextFunction, Request, Response } from 'express';

import { AUTH_ERROR_MESSAGE, AUTH_SUCCESS_MESSAGE } from '../constants/errors';
import { LoggerTags } from '../constants/logger';
import { BadRequestError, UnauthorizedError } from '../errors/Error';
import { createTaggedLogger } from '../logger';
import {
  activateUser,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
} from '../services/authService';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
  validateRefreshToken,
} from '../services/tokenService';
import {
  GeneralSuccessResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/controllers/auth';
import { LoggedInUserData } from '../types/express';

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
 * Activate user request handler
 * @param req - HTTP request with activation token.
 * @param res - HTTP response with success message.
 * @param next
 * @returns {Promise<void>}
 */
export const activateRequestHandler = async (
  req: Request<{ token?: string }, GeneralSuccessResponse, unknown>,
  res: Response<GeneralSuccessResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('Trying to activate user');
    const { token: activationToken } = req.params;
    const userData = req.user as LoggedInUserData;
    if (!activationToken) {
      logger.error('Empty activation token');
      return next(new BadRequestError(AUTH_ERROR_MESSAGE.EMPTY_ACTIVATION_TOKEN));
    }

    if (!userData) {
      logger.error('No authenticated user data found');
      return next(new UnauthorizedError());
    }

    await activateUser(userData.id, activationToken);
    res.json({ message: AUTH_SUCCESS_MESSAGE.OK });
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

    if (!refreshToken) {
      return next(new UnauthorizedError());
    }

    const isTokenValid = validateRefreshToken(id, deviceId, refreshToken);

    if (!isTokenValid) {
      return next(new UnauthorizedError());
    }

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
    clearRefreshTokenCookie(res);
    res.json({ message: AUTH_SUCCESS_MESSAGE.OK });
  } catch (err) {
    next(err);
  }
};
