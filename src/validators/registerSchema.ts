import { AUTH_ERROR_MESSAGE } from '../exceptions/constants';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './constants';

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
  name: {
    trim: true,
    escape: true,
    notEmpty: { errorMessage: AUTH_ERROR_MESSAGE.EMPTY_NAME, bail: true },
    isLength: {
      min: NAME_MIN_LENGTH,
      max: NAME_MAX_LENGTH,
      errorMessage: AUTH_ERROR_MESSAGE.INVALID_NAME_LENGTH,
      bail: true,
    },
    matches: {
      options: /^[a-zA-Zа-яА-ЯёЁїЇіІєЄґҐ\s]+$/,
      errorMessage: AUTH_ERROR_MESSAGE.INVALID_NAME,
      bail: true,
    },
  },
  deviceId: {
    trim: true,
    notEmpty: { errorMessage: AUTH_ERROR_MESSAGE.EMPTY_DEVICE_ID, bail: true },
  },
};
