import { ERROR_MESSAGE } from '../constants';

export class UserError extends Error {}

export class UserNotFoundError extends UserError {
  message = ERROR_MESSAGE.USER_NOT_FOUND;
}
export class UserAlreadyExistsError extends UserError {
  message = ERROR_MESSAGE.USER_ALREADY_EXISTS;
}
