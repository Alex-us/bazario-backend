import { mockUserA } from '../../__mocks__/user';
import UserModel from '../../../account/models/user';
import {
  findUserByEmailOrThrow,
  findUserByEmailAndThrow,
  findUserByEmail,
  findUserByIdOrThrow,
  createUser,
  updateUserByIdOrThrow,
  updateUserByEmailOrThrow,
  setUserActiveOrThrow,
  blockUser,
} from '../../../account/services/userService';
import { ActivationTokenError } from '../../../errors/token';
import { UserNotFoundError, UserAlreadyExistsError } from '../../../errors/user';
import { UserBlockReasons } from '../../../types';

jest.mock('../../../account/models/user');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds user by email or throws if not found', async () => {
    const email = 'test@example.com';
    (UserModel.findOne as jest.Mock).mockResolvedValueOnce(null);
    await expect(findUserByEmailOrThrow(email)).rejects.toThrow(UserNotFoundError);
  });

  it('finds user by email and throws if found', async () => {
    const email = 'test@example.com';
    (UserModel.findOne as jest.Mock).mockResolvedValueOnce({ email });
    await expect(findUserByEmailAndThrow(email)).rejects.toThrow(UserAlreadyExistsError);
  });

  it('finds user by email', async () => {
    const email = 'test@example.com';
    const user = { email };
    (UserModel.findOne as jest.Mock).mockResolvedValueOnce(user);
    const result = await findUserByEmail(email);
    expect(result).toEqual(user);
  });

  it('finds user by id or throws if not found', async () => {
    const id = '123';
    (UserModel.findById as jest.Mock).mockResolvedValueOnce(null);
    await expect(findUserByIdOrThrow(id)).rejects.toThrow(UserNotFoundError);
  });

  it('creates a new user', async () => {
    (UserModel.create as jest.Mock).mockResolvedValue(mockUserA);
    const result = await createUser(
      mockUserA.email,
      mockUserA.password,
      mockUserA.deviceId
    );
    expect(result).toEqual(mockUserA);
  });

  it('updateUserByIdOrThrow throws if not found', async () => {
    const id = '123';
    const data = { email: 'new@example.com' };
    (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(null);
    await expect(updateUserByIdOrThrow(id, data)).rejects.toThrow(UserNotFoundError);
  });

  it('updateUserByEmailOrThrow throws if not found', async () => {
    const email = 'test@example.com';
    const data = { email: 'new@example.com' };
    (UserModel.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(null);
    await expect(updateUserByEmailOrThrow(email, data)).rejects.toThrow(
      UserNotFoundError
    );
  });

  it('updateUserByEmailOrThrow updates user by email', async () => {
    const email = 'test@example.com';
    const data = { email: 'new@example.com' };
    (UserModel.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(mockUserA);
    const result = await updateUserByEmailOrThrow(email, data);
    expect(result).toEqual(mockUserA);
  });

  it('updateUserByIdOrThrow updates user by id', async () => {
    const id = '123';
    const data = { email: 'new@example.com' };
    (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(mockUserA);
    const result = await updateUserByIdOrThrow(id, data);
    expect(result).toEqual(mockUserA);
  });

  it('sets user active or throws if activation token is invalid', async () => {
    const id = '123';
    const activationToken = 'invalid-token';
    const user = { activationToken: 'valid-token' };
    jest.spyOn(UserModel, 'findById').mockResolvedValueOnce(user);
    await expect(setUserActiveOrThrow(id, activationToken)).rejects.toThrow(
      ActivationTokenError
    );
  });

  it('blocks user with token', async () => {
    const id = '123';
    const reason = UserBlockReasons.NEW_DEVICE_LOGIN;
    const user = { id, active: false, blockReason: reason, activationToken: null };
    const spy = jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValueOnce(user);
    const result = await blockUser(id, reason, true);
    expect(result).toEqual(user);
    spy.mockRestore();
  });
});
