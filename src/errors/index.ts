import { ERROR_MESSAGE } from './constants';

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, ERROR_MESSAGE.USER_NOT_AUTHORIZED);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, message);
  }
}
