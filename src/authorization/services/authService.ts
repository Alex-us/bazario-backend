import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

import getUserDTO from '../../account/dto/user';
import {
  createUser,
  findUserByEmailAndThrow,
  findUserByEmailOrThrow,
  findUserByIdOrThrow,
  setUserActiveOrThrow,
} from '../../account/services/userService';
import { IUser, UserBlockReasons } from '../../account/types';
import { ERROR_MESSAGE } from '../../errors/constants';
import { UserNotFoundError } from '../../errors/user';
import { createTaggedLogger } from '../../logger';
import { LoggerTags } from '../../logger/constants';
import {
  sendActivationEmail,
  sendLoginFromNewDeviceEmail,
} from '../../notifications/email/services/emailService';
import { credentialsData } from '../types';
import { generateAccessToken } from './accessTokenService';
import {
  deleteRefreshToken,
  generateRefreshTokenAndSaveToDb,
} from './refreshTokenService';

const MODULE_NAME = 'auth_service';

const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

export const sendUserActivation = async (user: IUser) => {
  try {
    logger.info('Trying to send user activation.', { id: user?._id });

    if (user.active) {
      logger.warn('User already activated', { id: user._id });
      return;
    }

    const activationToken = randomUUID();
    user.activationToken = activationToken;
    await user.save();
    await sendActivationEmail(user.email, { token: activationToken }, user.language);
    logger.info('Activation sent.', { id: user._id });
  } catch (error) {
    logger.error('Error sending activation email', { id: user?._id, error });
  }
};

export const registerUser = async (props: credentialsData) => {
  const { email, password, deviceId, ip } = props;
  logger.info('Trying to register user', { email, ip, deviceId });

  await findUserByEmailAndThrow(email);

  const user = await createUser(email, password, deviceId, ip);

  const userId = user._id.toString();
  logger.info('Created user in Db', { email, id: userId });

  const refreshToken = await generateRefreshTokenAndSaveToDb(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);
  logger.info('User registered successfully', { email, id: userId });

  await sendUserActivation(user);

  return {
    refreshToken,
    accessToken,
    user: getUserDTO(user),
  };
};

export const activateUser = async (id: string, activationToken: string) => {
  logger.info('Activating user', { id });

  await setUserActiveOrThrow(id, activationToken);

  logger.info('User activated', { id });
};

export const loginUser = async (props: credentialsData) => {
  const { email, password, deviceId, ip, userAgent } = props;
  logger.info('Trying to login user', { email, deviceId, ip });

  const user = await validateCredentials(email, password);
  await handleNewDeviceLogin(user, deviceId, ip, userAgent);

  user.lastLoginAt = new Date();
  await user.save();
  const userId = user._id.toString();
  const refreshToken = await generateRefreshTokenAndSaveToDb(userId, deviceId);
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
  await deleteRefreshToken(userId, deviceId);
};

export const refreshUserToken = async (userId: string, deviceId: string) => {
  logger.info('Refreshing users token', { id: userId, deviceId });
  await findUserByIdOrThrow(userId);

  const refreshToken = await generateRefreshTokenAndSaveToDb(userId, deviceId);
  const accessToken = generateAccessToken(userId, deviceId);
  logger.info('Token refreshed successfully', { id: userId, deviceId });
  return {
    refreshToken,
    accessToken,
  };
};

export const validateCredentials = async (
  email: string,
  password: string
): Promise<IUser> => {
  const user = await findUserByEmailOrThrow(email);

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.info('Password does not match', { email });
    throw new UserNotFoundError(ERROR_MESSAGE.INVALID_CREDENTIALS);
  }

  return user;
};

export const handleNewDeviceLogin = async (
  user: IUser,
  deviceId: string,
  ip?: string,
  userAgent?: string
): Promise<void> => {
  const isDeviceRecognized = user.confirmedDevices.some(
    device => device.deviceId === deviceId && device.ip === ip
  );

  if (!isDeviceRecognized) {
    logger.warn('User logged in from an unknown device', {
      email: user.email,
      deviceId,
      ip,
    });
    const token = randomUUID();

    user.activationToken = token;
    user.active = false;
    user.blockReason = UserBlockReasons.NEW_DEVICE_LOGIN;

    await sendLoginFromNewDeviceEmail(
      user.email,
      { token, ip, userAgent },
      user.language
    );
  }
};
