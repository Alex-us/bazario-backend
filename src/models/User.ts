import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  googleId?: string;
  facebookId?: string;
  phoneNumber?: string;
  isPhoneConfirmed: boolean;
  isEmailConfirmed: boolean;
  userName?: string;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleId: { type: String },
  facebookId: { type: String },
  phoneNumber: {type: String, unique: true},
  isPhoneConfirmed: {type: Boolean, required: true, default: false},
  isEmailConfirmed: {type: Boolean, required: true, default: false},
  userName: {type: String}
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
