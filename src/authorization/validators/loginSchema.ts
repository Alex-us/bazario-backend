import { ERROR_MESSAGE } from '../../errors/constants';

export default {
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
