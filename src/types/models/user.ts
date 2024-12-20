import { Document, Types } from 'mongoose';

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
  googleId?: string;
  facebookId?: string;
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
