import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';

import { IUser } from './types/userTypes';

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String },
  facebookId: { type: String },
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
