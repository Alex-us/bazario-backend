export const ACCESS_TOKEN_EXP = 15 * 60; // 15 min in seconds
export const REFRESH_TOKEN_EXP = 7 * 24 * 60 * 60; // 7d in seconds

export enum AuthMethod {
  CREDENTIALS = 'CREDENTIALS',
  GOOGLE_SSO = 'GOOGLE',
  FACEBOOK_SSO = 'FACEBOOK',
}
