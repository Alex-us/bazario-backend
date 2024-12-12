import {randomUUID} from 'node:crypto';

import {IUser} from '../models/User';
import mailService from './emailService';

export const sendActivation = async (user: IUser) => {

  if (user.active) {
    throw new Error(`User ${user.name} is already active`);
  }

  const activationToken = randomUUID();
  user.activationToken = activationToken;
  await user.save();
  await mailService.sendActivationMail(user.email, activationToken);
}