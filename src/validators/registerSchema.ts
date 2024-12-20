import { AUTH_ERROR_MESSAGE } from '../constants/errors';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../constants/validators';

export default {
  email: {
    trim: true,
    notEmpty: { errorMessage: AUTH_ERROR_MESSAGE.EMPTY_EMAIL, bail: true },
    isEmail: { errorMessage: AUTH_ERROR_MESSAGE.INVALID_EMAIL, bail: true },
  },
  password: {
    trim: true,
    notEmpty: { errorMessage: AUTH_ERROR_MESSAGE.EMPTY_PASS, bail: true },
    isLength: {
      min: PASSWORD_MIN_LENGTH,
      max: PASSWORD_MAX_LENGTH,
      errorMessage: AUTH_ERROR_MESSAGE.INVALID_PASS_LENGTH,
      bail: true,
    },
    matches: {
      options: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^(){}[\]<>])/,
      errorMessage: AUTH_ERROR_MESSAGE.INVALID_PASS,
    },
  },
  deviceId: {
    trim: true,
    notEmpty: { errorMessage: AUTH_ERROR_MESSAGE.EMPTY_DEVICE_ID, bail: true },
  },
};
