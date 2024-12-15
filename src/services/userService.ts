import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

import { AUTH_ERROR_MESSAGE } from '../errors/constants';
import { BadRequestError, UnauthorizedError } from '../errors/Error';
import { createTaggedLogger } from '../logger';
import { LoggerTags } from '../logger/constants';
import UserModel, { IUser } from '../models/User';
import { sendActivationMail } from './emailService';
import {
  deleteRefreshTokenFromDb,
  generateAccessToken,
  generateRefreshToken,
} from './tokenService';

const MODULE_NAME = 'user_service';

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

const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

export const registerUser = async (props: registerUserProps) => {
  const { name, email, password, deviceId, ip } = props;
  logger.info('Trying to register user', { name, email, ip });
  let user = await UserModel.findOne({ email });

  if (user) {
    logger.info('User with this email address already exists', { email });
    throw new BadRequestError(AUTH_ERROR_MESSAGE.USER_EXISTS);
  }

  user = await UserModel.create({ name, email, password, ipAddresses: [ip] });
  logger.info('Created user in Db', { email, id: user._id });
  const userId = user._id as string;

  // TODO: check email config and fix mailer transport error
  await sendUserActivation(user);
  const refreshToken = await generateRefreshToken(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);
  logger.info('User registered successfully', { email, id: user._id });
  return {
    refreshToken,
    accessToken,
  };
};

export const activateUser = async (id: string, activationToken: string) => {
  logger.info('Trying to activate user', { id });
  const user = await UserModel.findById(id);
  if (!user) {
    logger.info('No user found', { id });
    throw new UnauthorizedError();
  }
  if (user.activationToken !== activationToken) {
    logger.warn('Activation token provided is not equals to users token', {
      id,
      token: activationToken,
      userToken: user.activationToken,
    });
    throw new BadRequestError(AUTH_ERROR_MESSAGE.INVALID_ACTIVATION_TOKEN);
  }

  user.active = true;
  user.activationToken = undefined;
  await user.save();
  logger.info('User activated', { id });
};

export const loginUser = async (props: loginUserProps) => {
  const { email, password, deviceId, ip } = props;
  logger.info('Trying to login user', { email, deviceId, ip });
  const user = await UserModel.findOne({ email });

  if (!user) {
    logger.info('No user found in DB with this email', { email });
    throw new BadRequestError(AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
  }

  const isPassMatched = await bcrypt.compare(password, user.password);

  if (!isPassMatched) {
    logger.info('Password does not match', { email });
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
  logger.info('User successfully logged-in', { email });
  return {
    refreshToken,
    accessToken,
  };
};

export const logoutUser = async (userId: string, deviceId: string) => {
  logger.info('Logout user', { id: userId });
  return deleteRefreshTokenFromDb(userId, deviceId);
};

export const refreshUserToken = async (userId: string, deviceId: string) => {
  logger.info('Refreshing users token', { id: userId, deviceId });
  const userFromDb = await UserModel.findById(userId);

  if (!userFromDb) {
    logger.warn('No user found in Db', { id: userId });
    throw new UnauthorizedError();
  }
  const refreshToken = await generateRefreshToken(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);
  logger.info('Token refreshed successfully', { id: userId, deviceId });
  return {
    refreshToken,
    accessToken,
  };
};

export const sendUserActivation = async (user: IUser) => {
  logger.info('Trying to send user activation.', { id: user?._id });

  if (user.active) {
    logger.warn('User already activated', { id: user._id });
    throw new Error(`User ${user.name} is already active`);
  }

  const activationToken = randomUUID();
  user.activationToken = activationToken;
  await user.save();
  await sendActivationMail(user.email, activationToken);
  logger.info('Activation sent.', { id: user._id });
};

export const findUserById = async (userId: string) => {
  return UserModel.findById(userId);
};
