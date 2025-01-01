import { IUser, UserDTO } from '../types/user';

export default (user: IUser): UserDTO => {
  return {
    id: user._id.toString(),
    active: user.active,
    email: user.email,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    blockReason: user.blockReason,
  };
};
