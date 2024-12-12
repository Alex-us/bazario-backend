export enum AUTH_ERROR_MESSAGE {
  USER_NOT_AUTHORIZED = 'user_not_authorized',
  USER_NOT_FOUND = 'user_not_found',
  USER_EXISTS = 'user_already_exists',
  EMPTY_ACTIVATION_TOKEN = 'empty_activation_token',
  INVALID_ACTIVATION_TOKEN = 'invalid_activation_token',
  INVALID_CREDENTIALS = 'invalid_credentials',
  INVALID_TOKEN = 'invalid_token',
  INVALID_DEVICE_ID = 'invalid_device_id',
  EMPTY_DEVICE_ID = 'empty_device_id',
  EMPTY_PASS = 'empty_password',
  INVALID_PASS = 'invalid_password',
  INVALID_PASS_LENGTH = `invalid_password_length`,
  EMPTY_EMAIL = 'empty_email',
  INVALID_EMAIL = 'invalid_email',
  EMPTY_NAME = 'empty_name',
  INVALID_NAME_LENGTH = `invalid_name_length`,
  INVALID_NAME = 'invalid_name',
}

export enum AUTH_SUCCESS_MESSAGE {
  OK = 'ok',
}
