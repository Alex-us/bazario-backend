import bcrypt from 'bcryptjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockingoose = require('mockingoose');

import { mockUserA } from '../../__mocks__/user';
import User from '../models/user';
import { IUser } from '../types';

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockingoose.resetAll();
  });

  it('saves a user with hashed password', async () => {
    const hashedPassword = await bcrypt.hash(mockUserA.password, 10);

    mockingoose(User).toReturn({ ...mockUserA, password: hashedPassword }, 'save');
    mockingoose(User).toReturn({ ...mockUserA, password: hashedPassword }, 'findOne');

    const user = new User(mockUserA as unknown as IUser);
    await user.save();

    const savedUser = await User.findOne({ email: mockUserA.email });
    expect(savedUser).toBeTruthy();
    expect(savedUser?.password).not.toBe(mockUserA.password);
    const isMatch = await bcrypt.compare(
      mockUserA.password,
      savedUser?.password as string
    );
    expect(isMatch).toBe(true);
  });

  it('compares passwords correctly', async () => {
    const hashedPassword = await bcrypt.hash(mockUserA.password, 10);

    mockingoose(User).toReturn({ ...mockUserA, password: hashedPassword }, 'save');

    const user = new User(mockUserA as unknown as IUser);
    await user.save();

    jest
      .spyOn(bcrypt, 'compare')
      .mockResolvedValueOnce(true as never)
      .mockResolvedValueOnce(false as never);

    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);

    const isNotMatch = await user.comparePassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });

  it('does not hash password if not modified', async () => {
    const hashedPassword = await bcrypt.hash(mockUserA.password, 10);

    mockingoose(User).toReturn({ ...mockUserA, password: hashedPassword }, 'save');
    mockingoose(User).toReturn({ ...mockUserA, password: hashedPassword }, 'findOne');

    const user = new User(mockUserA as unknown as IUser);
    await user.save();

    const hashedSpy = jest.spyOn(bcrypt, 'hash');
    const isModifiedSpy = jest.spyOn(user, 'isModified' as any).mockReturnValue(false);

    user.email = 'newemail@example.com';
    await user.save();

    const savedUser = await User.findOne({ email: 'newemail@example.com' });
    expect(savedUser?.password).toBe(hashedPassword);

    const isMatch = await bcrypt.compare(
      mockUserA.password,
      savedUser?.password as string
    );
    expect(isMatch).toBe(true);
    expect(hashedSpy).toHaveBeenCalledTimes(1);
    hashedSpy.mockRestore();
    isModifiedSpy.mockRestore();
  });

  it('sets default values correctly', async () => {
    const defaultUser = {
      ...mockUserA,
      phoneVerified: false,
      active: false,
    };

    mockingoose(User).toReturn(defaultUser, 'save');
    mockingoose(User).toReturn(defaultUser, 'findOne');

    const user = new User(mockUserA as unknown as IUser);
    await user.save();

    const savedUser = await User.findOne({ email: 'test4@example.com' });
    expect(savedUser?.phoneVerified).toBe(false);
    expect(savedUser?.active).toBe(false);
  });
});
