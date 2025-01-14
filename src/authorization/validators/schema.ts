import { ERROR_MESSAGE, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../constants';

export const loginSchema = {
  email: {
    trim: true,
    notEmpty: { errorMessage: ERROR_MESSAGE.EMPTY_EMAIL, bail: true },
    isEmail: { errorMessage: ERROR_MESSAGE.INVALID_EMAIL, bail: true },
  },
  password: {
    trim: true,
    notEmpty: { errorMessage: ERROR_MESSAGE.EMPTY_PASS, bail: true },
  },
  deviceId: {
    trim: true,
    notEmpty: { errorMessage: ERROR_MESSAGE.EMPTY_DEVICE_ID, bail: true },
  },
};

export const registerSchema = {
  email: {
    trim: true,
    notEmpty: { errorMessage: ERROR_MESSAGE.EMPTY_EMAIL, bail: true },
    isEmail: { errorMessage: ERROR_MESSAGE.INVALID_EMAIL, bail: true },
  },
  password: {
    trim: true,
    notEmpty: { errorMessage: ERROR_MESSAGE.EMPTY_PASS, bail: true },
    isLength: {
      options: { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH },
      errorMessage: ERROR_MESSAGE.INVALID_PASS_LENGTH,
      bail: true,
    },
    matches: {
      options: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^(){}[\]<>])/,
      errorMessage: ERROR_MESSAGE.INVALID_PASS,
      bail: true,
    },
  },
  deviceId: {
    trim: true,
    notEmpty: { errorMessage: ERROR_MESSAGE.EMPTY_DEVICE_ID, bail: true },
  },
};
