import { FACEBOOK_ID, GOOGLE_ID } from '../models/constants';
import { Routes } from '../routes/constants';
import { PassportStrategy } from './types';

export const GOOGLE_CALLBACK_URL = `${Routes.AUTH.ROOT}${Routes.AUTH.GOOGLE_CALLBACK}`;
export const FACEBOOK_CALLBACK_URL = `${Routes.AUTH.ROOT}${Routes.AUTH.FACEBOOK_CALLBACK}`;

export const FACEBOOK_PROFILE_FIELDS = ['id', 'name', 'emails'];

export const PASSPORT_USER_QUERY_ID = {
  [PassportStrategy.Facebook]: FACEBOOK_ID,
  [PassportStrategy.Google]: GOOGLE_ID,
};
