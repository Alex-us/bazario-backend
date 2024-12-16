import { NextFunction, Request, Response } from 'express';

import { AUTH_ERROR_MESSAGE, AUTH_SUCCESS_MESSAGE } from '../errors/constants';
import { BadRequestError, UnauthorizedError } from '../errors/Error';
import { createTaggedLogger } from '../logger';
import { LoggerTags } from '../logger/constants';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
  validateRefreshToken,
} from '../services/tokenService';
import {
  activateUser,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
} from '../services/userService';
import {
  ActivateUserRequest,
  GeneralSuccessResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth';
import { LoggedInUserData } from '../types/express';

const MODULE_NAME = 'auth_controller';
const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

export const register = async (
  req: Request<RegisterRequest>,
  res: Response<RegisterResponse>,
  next: NextFunction
) => {
  try {
    const { name, email, password, deviceId, ip } = req.body;
    logger.info('Trying to register user', { ...req.body });
    const { accessToken, refreshToken } = await registerUser({
      name,
      email,
      password,
      deviceId,
      ip,
    });

    setRefreshTokenCookie(res, refreshToken);
    res.json({ token: accessToken });
    logger.info('User registered successfully', { email });
  } catch (err) {
    next(err);
  }
};

export const activate = async (
  req: Request<ActivateUserRequest>,
  res: Response<GeneralSuccessResponse>,
  next: NextFunction
) => {
  try {
    logger.info('Trying to activate user');
    const { token: activationToken } = req.params;
    const userData = req.user as LoggedInUserData;
    if (!activationToken) {
      logger.error('Empty activation token');
      next(new BadRequestError(AUTH_ERROR_MESSAGE.EMPTY_ACTIVATION_TOKEN));
    }

    if (!userData) {
      logger.error('No authenticated user data found');
      next(new UnauthorizedError());
    }

    await activateUser(userData.id, activationToken);
    res.json({ message: AUTH_SUCCESS_MESSAGE.OK });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request<LoginRequest>,
  res: Response<LoginResponse>,
  next: NextFunction
) => {
  try {
    const { email, password, deviceId } = req.body;
    const { refreshToken, accessToken } = await loginUser({
      email,
      password,
      deviceId,
    });
    setRefreshTokenCookie(res, refreshToken);
    res.json({ token: accessToken });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request<RefreshTokenRequest>,
  res: Response<RefreshTokenResponse>,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.cookies;
    const { id, deviceId } = req.user as LoggedInUserData;

    if (!refreshToken) {
      next(new UnauthorizedError());
      return;
    }

    const isTokenValid = validateRefreshToken(id, deviceId, refreshToken);

    if (!isTokenValid) {
      next(new UnauthorizedError());
      return;
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

export const logout = async (
  req: Request<LogoutRequest>,
  res: Response<GeneralSuccessResponse>,
  next: NextFunction
) => {
  try {
    const { id, deviceId } = req.user as LoggedInUserData;

    await logoutUser(id, deviceId);
    clearRefreshTokenCookie(res);
    res.json({ message: AUTH_SUCCESS_MESSAGE.OK });
  } catch (err) {
    next(err);
  }
};

// export const googleCallback = (req: Request, res: Response) => {
//   const token = jwt.sign(
//     { id: (req.user as IUser)?._id },
//     process.env.JWT_SECRET as string,
//     { expiresIn: '1h' }
//   );
//   res.redirect(`/?token=${token}`);
// };
//
// export const facebookCallback = (req: Request, res: Response) => {
//   const token = jwt.sign(
//     { id: (req.user as IUser)?._id },
//     process.env.JWT_SECRET as string,
//     { expiresIn: '1h' }
//   );
//   res.redirect(`/?token=${token}`);
// };
