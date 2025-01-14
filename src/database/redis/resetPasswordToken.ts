import {
  RESET_PASSWORD_TOKEN_EXP,
  RESET_PASSWORD_TOKEN_KEY_PREFIX,
} from '../../constants';
import { redisClient } from './client';

export const getResetPasswordTokenRedisKey = (email: string) => {
  return `${RESET_PASSWORD_TOKEN_KEY_PREFIX}${email}`;
};

export const saveResetPasswordToken = async (
  email: string,
  token: string
): Promise<void> => {
  const key = getResetPasswordTokenRedisKey(email);
  await redisClient.set(key, token, {
    EX: RESET_PASSWORD_TOKEN_EXP,
  });
};

export const getResetPasswordToken = async (email: string): Promise<string | null> => {
  const key = getResetPasswordTokenRedisKey(email);
  return redisClient.get(key);
};

export const deleteResetPasswordTokenFromDB = async (email: string): Promise<void> => {
  const key = getResetPasswordTokenRedisKey(email);
  await redisClient.del(key);
};
