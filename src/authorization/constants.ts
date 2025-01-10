import { FACEBOOK_ID_KEY, GOOGLE_ID_KEY } from '../account/constants';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 32;

export const ACCESS_TOKEN_EXP = 15 * 60; // 15 min in seconds
export const REFRESH_TOKEN_EXP = 7 * 24 * 60 * 60; // 7d in seconds

export const AUTH_COOKIE_NAME = 'refreshToken';

export enum AuthMethod {
  CREDENTIALS = 'CREDENTIALS',
  GOOGLE_SSO = 'GOOGLE',
  FACEBOOK_SSO = 'FACEBOOK',
}

export const AUTH_ROUTES = {
  ROOT: '/auth',
  LOGIN: '/login',
  REGISTER: '/register',
  LOGOUT: '/logout',
  REFRESH: '/refresh',
  RESET_PASSWORD: '/reset-password',
  GOOGLE: '/google',
  GOOGLE_CALLBACK: '/google/callback',
  FACEBOOK: '/facebook',
  FACEBOOK_CALLBACK: '/facebook/callback',
};

export enum PassportStrategy {
  Facebook = 'facebook',
  Google = 'google',
}

export const GOOGLE_CALLBACK_URL = `${AUTH_ROUTES.ROOT}${AUTH_ROUTES.GOOGLE_CALLBACK}`;
export const FACEBOOK_CALLBACK_URL = `${AUTH_ROUTES.ROOT}${AUTH_ROUTES.FACEBOOK_CALLBACK}`;

export const FACEBOOK_PROFILE_FIELDS = ['id', 'name', 'emails'];

export const PASSPORT_USER_QUERY_ID = {
  [PassportStrategy.Facebook]: FACEBOOK_ID_KEY,
  [PassportStrategy.Google]: GOOGLE_ID_KEY,
};
