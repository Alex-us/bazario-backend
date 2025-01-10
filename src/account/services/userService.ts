import { randomUUID } from 'node:crypto';

import { ERROR_MESSAGE } from '../../errors/constants';
import { ActivationTokenError } from '../../errors/token';
import { UserAlreadyExistsError, UserNotFoundError } from '../../errors/user';
import { createTaggedLogger } from '../../logger';
import { LoggerTags } from '../../logger/constants';
import UserModel from '../models/user';
import { IUser, UserBlockReasons } from '../types';

const MODULE_NAME = 'user_service';
const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

export const findUserByEmailOrThrow = async (email: string): Promise<IUser> => {
  logger.info('Fetching user by email', { email });
  const user = await UserModel.findOne({ email });
  if (!user) {
    logger.info('No user found', { email });
    throw new UserNotFoundError();
  }
  return user;
};

export const findUserByEmailAndThrow = async (email: string): Promise<void> => {
  logger.info('Fetching user by email', { email });
  const user = await UserModel.findOne({ email });
  if (user) {
    logger.info('User Already exists', { email });
    throw new UserAlreadyExistsError();
  }
};

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  logger.info('Fetching user by email', { email });
  return UserModel.findOne({ email });
};

export const findUserByIdOrThrow = async (id: string): Promise<IUser> => {
  logger.info('Fetching user by id', { id });
  const user = await UserModel.findById(id);
  if (!user) {
    logger.info('No user found', { id });
    throw new UserNotFoundError();
  }
  return user;
};

export const createUser = async (
  email: string,
  password: string,
  deviceId: string,
  ip?: string
): Promise<IUser> => {
  logger.info('Creating new user', { email, deviceId, ip });
  return UserModel.create({
    email,
    password,
    confirmedDevices: [{ deviceId, ip }],
    active: false,
    activationToken: randomUUID(),
    blockReason: UserBlockReasons.UNCONFIRMED_EMAIL,
  });
};

export const updateUserByIdOrThrow = async (
  id: string,
  data: Partial<IUser>
): Promise<IUser | null> => {
  logger.info('Updating user', { id });
  const user = UserModel.findByIdAndUpdate(id, data, { new: true });
  if (!user) {
    throw new UserNotFoundError();
  }
  return user;
};

export const updateUserByEmailOrThrow = async (email: string, data: Partial<IUser>) => {
  logger.info('Updating user by email', { email });
  const user = UserModel.findOneAndUpdate({ email }, { $set: { data } }, { new: true });
  if (!user) {
    throw new UserNotFoundError();
  }
  return user;
};

export const setUserActiveOrThrow = async (id: string, activationToken: string) => {
  const user = await findUserByIdOrThrow(id);
  if (user.activationToken !== activationToken) {
    logger.warn('Activation token provided is not equals to users token', {
      id,
      token: activationToken,
      userToken: user.activationToken,
    });
    throw new ActivationTokenError(ERROR_MESSAGE.INVALID_ACTIVATION_TOKEN);
  }
  user.active = true;
  user.activationToken = undefined;
  user.blockReason = undefined;
  await user.save();
};

export const blockUser = async (
  id: string,
  reason: UserBlockReasons,
  withToken: boolean
) => {
  logger.info('Blocking user', { id });
  return updateUserByIdOrThrow(id, {
    active: false,
    blockReason: reason,
    activationToken: withToken ? randomUUID() : undefined,
  });
};
