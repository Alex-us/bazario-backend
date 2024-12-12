import bcrypt from 'bcryptjs';

import { AUTH_ERROR_MESSAGE } from '../exceptions/constants';
import { BadRequestError, UnauthorizedError } from '../exceptions/Error';
import UserModel from '../models/User';
import {
  deleteRefreshTokenFromDb,
  generateAccessToken,
  generateRefreshToken,
} from './tokenService';

export type registerUserProps = {
  name: string;
  email: string;
  password: string;
  deviceId: string;
  ip?: string;
};

export type loginUserProps = {
  email: string;
  password: string;
  deviceId: string;
  ip?: string;
};

export const registerUser = async (props: registerUserProps) => {
  const { name, email, password, deviceId, ip } = props;
  let user = await UserModel.findOne({ email });

  if (user) {
    throw new BadRequestError(AUTH_ERROR_MESSAGE.USER_EXISTS);
  }

  user = await UserModel.create({ name, email, password, ipAddresses: [ip] });
  console.log('User created');
  const userId = user._id as string;

  // TODO: check email config and fix mailer transport error
  //await activationService.sendActivation(user);
  const refreshToken = await generateRefreshToken(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);
  return {
    refreshToken,
    accessToken,
  };
};

export const activateUser = async (id: string, activationToken: string) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new UnauthorizedError();
  }
  if (user.activationToken !== activationToken) {
    throw new BadRequestError(AUTH_ERROR_MESSAGE.INVALID_ACTIVATION_TOKEN);
  }

  user.active = true;
  user.activationToken = undefined;
  await user.save();
};

export const loginUser = async (props: loginUserProps) => {
  const { email, password, deviceId, ip } = props;
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new BadRequestError(AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
  }

  const isPassMatched = await bcrypt.compare(password, user.password);

  if (!isPassMatched) {
    throw new BadRequestError(AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
  }
  if (ip && !user.ipAddresses.includes(ip)) {
    user.ipAddresses.push(ip);
  }

  user.lastLoginAt = new Date();
  await user.save();
  const userId = user._id as string;
  const refreshToken = await generateRefreshToken(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);
  return {
    refreshToken,
    accessToken,
  };
};

export const logoutUser = async (userId: string, deviceId: string) => {
  return deleteRefreshTokenFromDb(userId, deviceId);
};

export const refreshUserToken = async (userId: string, deviceId: string) => {
  const userFromDb = await UserModel.findById(userId);

  if (!userFromDb) {
    throw new UnauthorizedError();
  }
  const refreshToken = await generateRefreshToken(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);

  return {
    refreshToken,
    accessToken,
  };
};

export const findUserById = async (userId: string) => {
  return UserModel.findById(userId);
};
