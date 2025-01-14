import { Request, Response, NextFunction } from 'express';

import {
  requestPasswordResetRequestHandler,
  validateResetTokenRequestHandler,
  passwordResetRequestHandler,
  activateRequestHandler,
} from '../../../account/controllers/accountController';
import {
  requestPasswordReset,
  resetPassword,
  activateAccount,
} from '../../../account/services/accountService';
import { findResetPasswordTokenOrThrow } from '../../../account/services/resetPasswordTokenService';
import { RESPONSE_SUCCESS_MESSAGE } from '../../../constants';
import { UnauthorizedError } from '../../../errors';

jest.mock('../../../account/services/accountService');
jest.mock('../../../account/services/resetPasswordTokenService');

describe('AccountController', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} } as Request;
    res = { json: jest.fn() } as unknown as Response;
    next = jest.fn();
  });

  describe('requestPasswordResetRequestHandler', () => {
    it('should send success response when password reset request is successful', async () => {
      req.body.email = 'test@example.com';
      await requestPasswordResetRequestHandler(req, res, next);
      expect(requestPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(res.json).toHaveBeenCalledWith({ message: RESPONSE_SUCCESS_MESSAGE.OK });
    });

    it('should call next with error when password reset request fails', async () => {
      const error = new Error('Reset failed');
      (requestPasswordReset as jest.Mock).mockRejectedValue(error);
      await requestPasswordResetRequestHandler(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateResetTokenRequestHandler', () => {
    it('should send success response when token is valid', async () => {
      req.body = { token: 'valid-token', email: 'test@example.com' };
      await validateResetTokenRequestHandler(req, res, next);
      expect(findResetPasswordTokenOrThrow).toHaveBeenCalledWith(
        'test@example.com',
        'valid-token'
      );
      expect(res.json).toHaveBeenCalledWith({ message: RESPONSE_SUCCESS_MESSAGE.OK });
    });

    it('should call next with error when token validation fails', async () => {
      const error = new Error('Invalid token');
      (findResetPasswordTokenOrThrow as jest.Mock).mockRejectedValue(error);
      await validateResetTokenRequestHandler(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('passwordResetRequestHandler', () => {
    it('should send success response when password reset is successful', async () => {
      req.body = {
        token: 'valid-token',
        email: 'test@example.com',
        password: 'new-password',
      };
      await passwordResetRequestHandler(req, res, next);
      expect(resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        'valid-token',
        'new-password'
      );
      expect(res.json).toHaveBeenCalledWith({ message: RESPONSE_SUCCESS_MESSAGE.OK });
    });

    it('should call next with error when password reset fails', async () => {
      const error = new Error('Reset failed');
      (resetPassword as jest.Mock).mockRejectedValue(error);
      await passwordResetRequestHandler(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('activateRequestHandler', () => {
    it('should send success response when account activation is successful', async () => {
      req.body.token = 'activation-token';
      req.user = { id: 'user-id', deviceId: 'deviceId' };
      await activateRequestHandler(req, res, next);
      expect(activateAccount).toHaveBeenCalledWith('user-id', 'activation-token');
      expect(res.json).toHaveBeenCalledWith({ message: RESPONSE_SUCCESS_MESSAGE.OK });
    });

    it('should call next with UnauthorizedError when user is not authenticated', async () => {
      req.body.token = 'activation-token';
      await activateRequestHandler(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next with error when account activation fails', async () => {
      const error = new Error('Activation failed');
      req.body.token = 'activation-token';
      req.user = { id: 'user-id', deviceId: 'deviceId' };
      (activateAccount as jest.Mock).mockRejectedValue(error);
      await activateRequestHandler(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
