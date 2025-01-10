import { Document, Types } from 'mongoose';

import { Language } from '../../lang/constants';
import { FACEBOOK_ID_KEY, GOOGLE_ID_KEY } from '../constants';

export interface ActivateUserRequest {
  token?: string;
}

export interface ResetPasswordRequest extends validateResetPasswordTokenRequest {
  password: string;
}

export interface validateResetPasswordTokenRequest {
  token: string;
  email: string;
}

export interface RequestResetPasswordRequest {
  email: string;
}

export enum UserBlockReasons {
  UNCONFIRMED_EMAIL = 'UNCONFIRMED_EMAIL',
  NEW_DEVICE_LOGIN = 'NEW_DEVICE_LOGIN',
}

export interface IConfirmedDevice {
  deviceId: string;
  ip: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  [GOOGLE_ID_KEY]?: string;
  [FACEBOOK_ID_KEY]?: string;
  phone?: string;
  activationToken?: string;
  phoneVerified: boolean;
  phoneVerificationCode?: string;
  active: boolean;
  firstName: string;
  lastName: string;
  createdAt: Date;
  lastLoginAt: Date;
  confirmedDevices: IConfirmedDevice[];
  blockReason?: UserBlockReasons;
  language: Language;
  comparePassword(password: string): Promise<boolean>;
}

export type UserDTO = Pick<
  IUser,
  | 'email'
  | 'phone'
  | 'phoneVerified'
  | 'active'
  | 'firstName'
  | 'lastName'
  | 'createdAt'
  | 'lastLoginAt'
  | 'blockReason'
> & { id: string };
