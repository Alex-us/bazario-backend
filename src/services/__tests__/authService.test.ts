import bcrypt from 'bcryptjs';

import { BadRequestError, UnauthorizedError } from '../../errors/Error';
import UserModel from '../../models/User';
import getUserDTO from '../../models/User/dto';
import { IUser, UserBlockReasons } from '../../types/models/user';
import * as authService from '../authService';
import { sendUserActivation } from '../authService';
import { sendActivationMail } from '../emailService';
import {
  generateAccessToken,
  generateRefreshToken,
  deleteRefreshTokenFromDb,
} from '../tokenService';
import { mockUserA, userAProps } from './mocks';

jest.mock('../../models/User');
jest.mock('bcryptjs');
jest.mock('../emailService');
jest.mock('../tokenService');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('registers a new user successfully', async () => {
      const refreshToken = 'refreshToken_1345';
      const accessToken = 'accessToken_1345';

      (UserModel.create as jest.Mock).mockResolvedValue(mockUserA);
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      (generateRefreshToken as jest.Mock).mockResolvedValue(refreshToken);
      (generateAccessToken as jest.Mock).mockReturnValue(accessToken);

      const spy = jest.spyOn(authService, 'sendUserActivation').mockResolvedValue();
      const result = await authService.registerUser(userAProps);

      expect(result).toEqual({
        refreshToken,
        accessToken,
        user: getUserDTO(mockUserA as unknown as IUser),
      });
      expect(generateRefreshToken).toHaveBeenCalledWith(
        mockUserA._id,
        userAProps.deviceId
      );
      expect(generateAccessToken).toHaveBeenCalledWith(
        mockUserA._id,
        userAProps.deviceId
      );

      expect(sendUserActivation).toHaveBeenCalledWith(mockUserA);

      expect(UserModel.create).toHaveBeenCalledWith({
        email: userAProps.email,
        password: userAProps.password,
        confirmedDevices: [{ deviceId: userAProps.deviceId, ip: userAProps.ip }],
        active: false,
        blockReason: UserBlockReasons.UNCONFIRMED_EMAIL,
      });

      spy.mockRestore();
    });

    it('throws an error if user already exists', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await expect(authService.registerUser(userAProps)).rejects.toThrow(BadRequestError);
    });

    it('not throwing an error if sending user activation mail fails', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue(mockUserA);
      const spy = jest
        .spyOn(authService, 'sendUserActivation')
        .mockRejectedValue(new Error('SMTP error'));

      await expect(authService.registerUser(userAProps)).resolves.toBeDefined();
      spy.mockRestore();
    });
  });

  describe('activateUser', () => {
    it('activates a user successfully', async () => {
      const user = {
        ...mockUserA,
        activationToken: 'validToken',
        blockReason: UserBlockReasons.UNCONFIRMED_EMAIL,
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(user);

      await authService.activateUser('userId', 'validToken');

      expect(user.save).toHaveBeenCalled();
      expect(user).toMatchObject({
        active: true,
        activationToken: undefined,
        blockReason: undefined,
      });
    });

    it('throws an error if user is not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.activateUser('userId', 'validToken')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('throws an error if activation token is invalid', async () => {
      const user = { _id: 'userId', activationToken: 'validToken', active: false };
      (UserModel.findById as jest.Mock).mockResolvedValue(user);

      await expect(authService.activateUser('userId', 'invalidToken')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('loginUser', () => {
    it('logs in a user successfully', async () => {
      const refreshToken = 'refreshToken_111';
      const accessToken = 'accessToken_111';

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUserA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateRefreshToken as jest.Mock).mockResolvedValue(refreshToken);
      (generateAccessToken as jest.Mock).mockReturnValue(accessToken);

      const result = await authService.loginUser(userAProps);

      expect(result).toEqual({
        refreshToken: refreshToken,
        accessToken: accessToken,
        user: getUserDTO(mockUserA as unknown as IUser),
      });
    });

    it('throws an error if password does not match', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUserA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.loginUser(userAProps)).rejects.toThrow(BadRequestError);
    });

    it('throws an error if user not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.loginUser(userAProps)).rejects.toThrow(BadRequestError);
    });
  });

  describe('logoutUser', () => {
    it('logs out a user successfully', async () => {
      (deleteRefreshTokenFromDb as jest.Mock).mockResolvedValue(true);

      const result = await authService.logoutUser('userId', 'deviceId');

      expect(result).toBe(true);
    });

    it('throws an error if token deletion fails', async () => {
      (deleteRefreshTokenFromDb as jest.Mock).mockRejectedValue(
        new Error('Something goes wrong')
      );

      await expect(authService.logoutUser('userId', 'deviceId')).rejects.toThrow(Error);
    });
  });

  describe('refreshUserToken', () => {
    it('refreshes user token successfully', async () => {
      const mockUser = { _id: 'userId' };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (generateRefreshToken as jest.Mock).mockResolvedValue('refreshToken');
      (generateAccessToken as jest.Mock).mockReturnValue('accessToken');

      const result = await authService.refreshUserToken('userId', 'deviceId');

      expect(result).toEqual({
        refreshToken: 'refreshToken',
        accessToken: 'accessToken',
      });
    });

    it('throws an error if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshUserToken('userId', 'deviceId')).rejects.toThrow(
        Error
      );
    });
  });

  describe('findUserById', () => {
    it('finds a user by id successfully', async () => {
      const mockUser = { _id: 'userId' };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.findUserById('userId');

      expect(result).toEqual(mockUser);
    });
  });

  describe('sendUserActivation', () => {
    it('sends activation email to inactive user', async () => {
      const user = { ...mockUserA, active: false, save: jest.fn() };
      (sendActivationMail as jest.Mock).mockResolvedValue('');
      await authService.sendUserActivation(user as unknown as IUser);
      expect(user.save).toHaveBeenCalled();
      expect(sendActivationMail).toHaveBeenCalledWith(user.email, user.activationToken);
    });

    it('throws error if user is already active', async () => {
      const user = { ...mockUserA, active: true };
      await expect(
        authService.sendUserActivation(user as unknown as IUser)
      ).rejects.toThrow(Error);
    });
  });

  describe('findUserById', () => {
    it('finds user by id successfully', async () => {
      const mockUser = { _id: 'userId' };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const result = await authService.findUserById('userId');
      expect(result).toEqual(mockUser);
    });
  });
});
