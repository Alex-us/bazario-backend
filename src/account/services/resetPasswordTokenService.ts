import { randomUUID } from 'node:crypto';

import {
  deleteResetPasswordTokenFromDB,
  getResetPasswordToken,
  saveResetPasswordToken,
} from '../../database/redis/resetPasswordToken';

export const generateResetPasswordToken = async (email: string): Promise<string> => {
  const token = randomUUID();
  await saveResetPasswordToken(email, token);
  return token;
};

export const findResetPasswordTokenOrThrow = async (
  email: string,
  token: string
): Promise<string> => {
  const tokenFromDb = await getResetPasswordToken(email);
  if (!token || tokenFromDb !== token) {
    throw new Error('Invalid token');
  }
  return tokenFromDb;
};

export const deleteResetPasswordToken = async (email: string): Promise<void> => {
  await deleteResetPasswordTokenFromDB(email);
};
