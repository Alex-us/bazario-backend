import { NextFunction, Request, Response } from 'express';

import { AUTH_ERROR_MESSAGE, AUTH_SUCCESS_MESSAGE } from '../exceptions/constants';
import { BadRequestError, UnauthorizedError } from '../exceptions/Error';
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
import { LoggedInUserData } from '../types/express';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, deviceId, ip } = req.body;
    const { accessToken, refreshToken } = await registerUser({
      name,
      email,
      password,
      deviceId,
      ip,
    });

    setRefreshTokenCookie(res, refreshToken);
    res.json({ token: accessToken });
  } catch (err) {
    next(err);
  }
};

export const activate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token: activationToken } = req.params;
    const userData = req.user as LoggedInUserData;
    if (!activationToken) {
      next(new BadRequestError(AUTH_ERROR_MESSAGE.EMPTY_ACTIVATION_TOKEN));
    }

    if (!userData) {
      next(new UnauthorizedError());
    }

    await activateUser(userData.id, activationToken);
    res.json({ message: AUTH_SUCCESS_MESSAGE.OK });
  } catch (err) {
    console.error(`Cannot activate user due to error: ${err}`);
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
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
    console.error(`Cannot login due to error: ${err}`);
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
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
    console.error('Cannot refresh token due to error: ', err);
    next(err);
  }
};

export const getUsers = async () => {};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, deviceId } = req.user as LoggedInUserData;

    await logoutUser(id, deviceId);
    clearRefreshTokenCookie(res);
    res.json({ message: AUTH_SUCCESS_MESSAGE.OK });
  } catch (err) {
    console.error('Error when logging out: ', err);
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
