export const GOOGLE_ID_KEY = 'googleId';
export const FACEBOOK_ID_KEY = 'facebookId';

export const RESET_PASSWORD_TOKEN_EXP = 24 * 60 * 60; // 24h in seconds

export const ACCOUNT_ROUTES = {
  ROOT: '/account',
  ACTIVATE: '/activate',
  REQUEST_RESET_PASSWORD: '/request-reset-password',
  VALIDATE_RESET_PASSWORD_TOKEN: '/validate-reset-password-token/:token',
  RESET_PASSWORD: '/reset-password',
};
