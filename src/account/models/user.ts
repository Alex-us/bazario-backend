import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';

import { Language, FACEBOOK_ID_KEY, GOOGLE_ID_KEY } from '../../constants';
import { IUser } from '../../types';

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  [GOOGLE_ID_KEY]: { type: String },
  [FACEBOOK_ID_KEY]: { type: String },
  phone: { type: String },
  phoneVerified: { type: Boolean, required: true, default: false },
  phoneVerificationCode: { type: String },
  active: { type: Boolean, required: true, default: false },
  firstName: { type: String },
  lastName: { type: String },
  activationToken: { type: String },
  createdAt: { type: Date, default: Date.now() },
  lastLoginAt: { type: Date },
  confirmedDevices: [
    {
      deviceId: { type: String },
      ip: { type: String },
    },
  ],
  blockReason: { type: String },
  language: { type: String, default: Language.UA },
});

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password as string);
};

export default model<IUser>('User', UserSchema);
