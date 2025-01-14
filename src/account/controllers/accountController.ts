import { NextFunction, Request, Response } from 'express';

import { RESPONSE_SUCCESS_MESSAGE, LoggerTags } from '../../constants';
import { UnauthorizedError } from '../../errors';
import { createTaggedLogger } from '../../logger';
import {
  GeneralSuccessResponse,
  ActivateUserRequest,
  RequestResetPasswordRequest,
  ResetPasswordRequest,
  validateResetPasswordTokenRequest,
} from '../../types';
import { LoggedInUserData } from '../../types/express';
import {
  activateAccount,
  requestPasswordReset,
  resetPassword,
} from '../services/accountService';
import { findResetPasswordTokenOrThrow } from '../services/resetPasswordTokenService';

const MODULE_NAME = 'account_controller';
const logger = createTaggedLogger([LoggerTags.ACCOUNT, MODULE_NAME]);

/**
 * Handles the password reset request.
 *
 * This asynchronous request handler processes a request to reset a user's password.
 * It retrieves the email address from the request parameters, triggers the password
 * reset process, and sends a success response if the operation is successful.
 */

export const requestPasswordResetRequestHandler = async (
  req: Request<unknown, GeneralSuccessResponse, RequestResetPasswordRequest>,
  res: Response<GeneralSuccessResponse>,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;

  try {
    await requestPasswordReset(email);
    res.json({ message: RESPONSE_SUCCESS_MESSAGE.OK });
  } catch (err) {
    logger.error('Error resetting password', { error: err });
    next(err);
  }
};

/**
 * Handles the validation of a reset token request.
 *
 * This asynchronous request handler validates the reset password token associated
 * with the provided email address. If the token is invalid or an error occurs,
 * the error is passed to the error-handling middleware. If the token is valid,
 * a success response is sent.
 */
export const validateResetTokenRequestHandler = async (
  req: Request<unknown, GeneralSuccessResponse, validateResetPasswordTokenRequest>,
  res: Response<GeneralSuccessResponse>,
  next: NextFunction
): Promise<void> => {
  const { token, email } = req.body;
  try {
    await findResetPasswordTokenOrThrow(email, token);
    res.json({ message: RESPONSE_SUCCESS_MESSAGE.OK });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles the password reset request.
 *
 * Processes the incoming request containing the user's email, reset token,
 * and the new password. Attempts to reset the password using the provided
 * details. On success, sends a success response. On failure, delegates
 * error handling to the next middleware.
 */
export const passwordResetRequestHandler = async (
  req: Request<unknown, GeneralSuccessResponse, ResetPasswordRequest>,
  res: Response<GeneralSuccessResponse>,
  next: NextFunction
): Promise<void> => {
  const { token, email, password } = req.body;

  try {
    await resetPassword(email, token, password);
    res.json({ message: RESPONSE_SUCCESS_MESSAGE.OK });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles the activation of a user's account.
 *
 * This asynchronous request handler is responsible for activating a user account based on the given
 * activation token. The activation logic includes extracting the activation token from the request
 * parameters and the user information from the authenticated request. It then calls the `activateAccount`
 * function to perform the activation process.
 */
export const activateRequestHandler = async (
  req: Request<unknown, GeneralSuccessResponse, ActivateUserRequest>,
  res: Response<GeneralSuccessResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('Trying to activate user');
    const { token } = req.body;
    const userData = req.user as LoggedInUserData;
    if (!userData) {
      throw new UnauthorizedError();
    }
    await activateAccount(userData.id, token);
    res.json({ message: RESPONSE_SUCCESS_MESSAGE.OK });
  } catch (err) {
    next(err);
  }
};
