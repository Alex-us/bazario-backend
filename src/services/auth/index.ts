import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

import { BadRequestError, UnauthorizedError } from '../../errors';
import { AUTH_ERROR_MESSAGE } from '../../errors/constants';
import { createTaggedLogger } from '../../logger';
import { LoggerTags } from '../../logger/constants';
import getUserDTO from '../../models/dto/user';
import { UserBlockReasons, IUser } from '../../models/types/user';
import UserModel from '../../models/User';
import { sendActivationMail, sendEmail } from '../email';
import {
  deleteRefreshTokenFromDb,
  generateAccessToken,
  generateRefreshToken,
} from '../token';
import { credentialsData } from '../types';

const MODULE_NAME = 'auth_service';

const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

export const sendUserActivation = async (user: IUser) => {
  logger.info('Trying to send user activation.', { id: user?._id });

  if (user.active) {
    logger.warn('User already activated', { id: user._id });
    throw new Error(`User ${user.email} is already active`);
  }

  const activationToken = randomUUID();
  user.activationToken = activationToken;
  await user.save();
  await sendActivationMail(user.email, activationToken);
  logger.info('Activation sent.', { id: user._id });
};

export const registerUser = async (props: credentialsData) => {
  const { email, password, deviceId, ip } = props;
  logger.info('Trying to register user', { email, ip, deviceId });
  let user = await UserModel.findOne({ email });

  if (user) {
    logger.info('User with this email address already exists', { email });
    throw new BadRequestError(AUTH_ERROR_MESSAGE.USER_EXISTS);
  }

  user = await UserModel.create({
    email,
    password,
    confirmedDevices: [{ deviceId, ip }],
    active: false,
    blockReason: UserBlockReasons.UNCONFIRMED_EMAIL,
  });
  const userId = user._id.toString();
  logger.info('Created user in Db', { email, id: userId });

  const refreshToken = await generateRefreshToken(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);
  logger.info('User registered successfully', { email, id: userId });

  try {
    await sendUserActivation(user);
  } catch (error) {
    logger.error('Error sending activation email', { email, error });
  }

  return {
    refreshToken,
    accessToken,
    user: getUserDTO(user),
  };
};

export const activateUser = async (id: string, activationToken: string) => {
  logger.info('Activating user', { id });
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
  user.blockReason = undefined;
  await user.save();
  logger.info('User activated', { id });
};

export const loginUser = async (props: credentialsData) => {
  const { email, password, deviceId, ip, userAgent } = props;
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

  const existingDevice = user.confirmedDevices.find(
    device => device.deviceId === deviceId && device.ip === ip
  );

  if (!existingDevice) {
    logger.warn('User logged from unknown device', { email, deviceId, ip });

    user.active = false;
    user.activationToken = randomUUID();
    user.blockReason = UserBlockReasons.NEW_DEVICE_LOGIN;

    await sendEmail({
      to: email,
      type: user.blockReason,
      ip,
      token: user.activationToken,
      userAgent,
    });
  }

  user.lastLoginAt = new Date();
  await user.save();
  const userId = user._id.toString();
  const refreshToken = await generateRefreshToken(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);
  logger.info('User successfully logged-in', { email });
  return {
    refreshToken,
    accessToken,
    user: getUserDTO(user),
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

export const findUserById = async (userId: string) => {
  return UserModel.findById(userId);
};
