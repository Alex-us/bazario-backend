import bcrypt from 'bcryptjs';

import { mockUserA, userAProps } from '../../__mocks__/user';
import getUserDTO from '../../account/dto/user';
import UserModel from '../../account/models/user';
import { findUserByIdOrThrow } from '../../account/services/userService';
import { IUser, UserBlockReasons } from '../../account/types';
import * as authService from '../../authorization/services/authService';
import { ActivationTokenError } from '../../errors/token';
import { UserAlreadyExistsError, UserNotFoundError } from '../../errors/user';
import { Language } from '../../lang/constants';
import { sendActivationEmail } from '../../notifications/email/services/emailService';
import { generateAccessToken } from '../services/accessTokenService';
import {
  generateRefreshTokenAndSaveToDb,
  deleteRefreshToken,
} from '../services/refreshTokenService';

jest.mock('../../account/models/user');
jest.mock('bcryptjs');
jest.mock('../../notifications/email/services/emailService');
jest.mock('../services/accessTokenService');
jest.mock('../services/refreshTokenService');

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

      (generateRefreshTokenAndSaveToDb as jest.Mock).mockResolvedValue(refreshToken);
      (generateAccessToken as jest.Mock).mockReturnValue(accessToken);

      const spy = jest.spyOn(authService, 'sendUserActivation').mockResolvedValue();
      const result = await authService.registerUser(userAProps);

      expect(result).toEqual({
        refreshToken,
        accessToken,
        user: getUserDTO(mockUserA as unknown as IUser),
      });
      expect(generateRefreshTokenAndSaveToDb).toHaveBeenCalledWith(
        mockUserA._id.toString(),
        userAProps.deviceId
      );
      expect(generateAccessToken).toHaveBeenCalledWith(
        mockUserA._id.toString(),
        userAProps.deviceId
      );

      expect(authService.sendUserActivation).toHaveBeenCalledWith(mockUserA);

      expect(UserModel.create).toHaveBeenCalledWith({
        activationToken: expect.any(String),
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

      await expect(authService.registerUser(userAProps)).rejects.toThrow(
        UserAlreadyExistsError
      );
    });

    it('not throwing an error if sending user activation mail fails', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue(mockUserA);
      (sendActivationEmail as jest.Mock).mockRejectedValueOnce(
        new Error('Something went wrong')
      );

      await expect(authService.registerUser(userAProps)).resolves.toBeDefined();
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
        UserNotFoundError
      );
    });

    it('throws an error if activation token is invalid', async () => {
      const user = { _id: 'userId', activationToken: 'validToken', active: false };
      (UserModel.findById as jest.Mock).mockResolvedValue(user);

      await expect(authService.activateUser('userId', 'invalidToken')).rejects.toThrow(
        ActivationTokenError
      );
    });
  });

  describe('loginUser', () => {
    it('logs in a user successfully', async () => {
      const refreshToken = 'refreshToken_111';
      const accessToken = 'accessToken_111';

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUserA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateRefreshTokenAndSaveToDb as jest.Mock).mockResolvedValue(refreshToken);
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

      await expect(authService.loginUser(userAProps)).rejects.toThrow(UserNotFoundError);
    });

    it('throws an error if user not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.loginUser(userAProps)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('logoutUser', () => {
    it('logs out a user successfully', async () => {
      (deleteRefreshToken as jest.Mock).mockResolvedValue(true);

      await authService.logoutUser('userId', 'deviceId');

      expect(deleteRefreshToken).toHaveBeenCalledWith('userId', 'deviceId');
    });

    it('throws an error if token deletion fails', async () => {
      (deleteRefreshToken as jest.Mock).mockRejectedValue(
        new Error('Something goes wrong')
      );

      await expect(authService.logoutUser('userId', 'deviceId')).rejects.toThrow(Error);
    });
  });

  describe('refreshUserToken', () => {
    it('refreshes user token successfully', async () => {
      const mockUser = { _id: 'userId' };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (generateRefreshTokenAndSaveToDb as jest.Mock).mockResolvedValue('refreshToken');
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

      const result = await findUserByIdOrThrow('userId');

      expect(result).toEqual(mockUser);
    });
  });

  describe('sendUserActivation', () => {
    it('sends activation email to inactive user', async () => {
      const user = { ...mockUserA, active: false, save: jest.fn() };
      (sendActivationEmail as jest.Mock).mockResolvedValue('');
      await authService.sendUserActivation(user as unknown as IUser);
      expect(user.save).toHaveBeenCalled();
      expect(sendActivationEmail).toHaveBeenCalledWith(
        user.email,
        { token: user.activationToken },
        Language.UA
      );
    });

    it('throws error if user is already active', async () => {
      const user = { ...mockUserA, active: true, activationToken: undefined };
      await authService.sendUserActivation(user as unknown as IUser);
      expect(sendActivationEmail).toHaveBeenCalledTimes(0);
      expect(user.save).toHaveBeenCalledTimes(0);
      expect(user.activationToken).toBeUndefined();
    });
  });

  describe('findUserById', () => {
    it('finds user by id successfully', async () => {
      const mockUser = { _id: 'userId' };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const result = await findUserByIdOrThrow('userId');
      expect(result).toEqual(mockUser);
    });
  });
});
