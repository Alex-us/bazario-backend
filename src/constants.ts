export const ACCESS_TOKEN_EXP = 15 * 60 * 1000; // 15 min
export const REFRESH_TOKEN_EXP = 7 * 24 * 60 * 60 * 1000; // 7d

export enum AuthMethod {
  CREDENTIALS = 'CREDENTIALS',
  GOOGLE_SSO = 'GOOGLE',
  FACEBOOK_SSO = 'FACEBOOK',
}
