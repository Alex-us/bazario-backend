import { AUTH_ERROR_MESSAGE } from '../constants/errors';

export default {
  email: {
    trim: true,
    notEmpty: { errorMessage: AUTH_ERROR_MESSAGE.EMPTY_EMAIL, bail: true },
    isEmail: { errorMessage: AUTH_ERROR_MESSAGE.INVALID_EMAIL, bail: true },
  },
  password: {
    trim: true,
    notEmpty: { errorMessage: AUTH_ERROR_MESSAGE.EMPTY_PASS, bail: true },
  },
  deviceId: {
    trim: true,
    notEmpty: { errorMessage: AUTH_ERROR_MESSAGE.EMPTY_DEVICE_ID, bail: true },
  },
};
