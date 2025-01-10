import passport, { Profile } from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';

import User from '../../account/models/user';
import { createTaggedLogger } from '../../logger';
import { LoggerTags } from '../../logger/constants';
import {
  FACEBOOK_CALLBACK_URL,
  FACEBOOK_PROFILE_FIELDS,
  GOOGLE_CALLBACK_URL,
  PASSPORT_USER_QUERY_ID,
} from '../constants';
import { PassportStrategy } from '../constants';

const MODULE_NAME = 'passport';

const logger = createTaggedLogger([LoggerTags.AUTH, MODULE_NAME]);

const getProfileUserNames = (strategy: PassportStrategy, profile: Profile) => {
  switch (strategy) {
    case PassportStrategy.Facebook:
      return `${profile.name?.givenName} ${profile.name?.familyName}`;
    case PassportStrategy.Google:
      return profile.displayName;
    default:
      return '';
  }
};

export const getVerifyCallback = (strategy: PassportStrategy) => {
  return async (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => {
    const userQuery = { [PASSPORT_USER_QUERY_ID[strategy]]: profile.id };

    logger.info(`Verifying user with ${strategy} strategy`, { userQuery });
    try {
      let user = await User.findOne(userQuery);
      if (!user) {
        user = await User.create({
          ...userQuery,
          email: profile.emails ? profile.emails[0].value : '',
          userName: getProfileUserNames(strategy, profile),
        });
      }
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  };
};
export const initPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      getVerifyCallback(PassportStrategy.Google)
    )
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID as string,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
        callbackURL: FACEBOOK_CALLBACK_URL,
        profileFields: FACEBOOK_PROFILE_FIELDS,
      },
      getVerifyCallback(PassportStrategy.Facebook)
    )
  );
};

export default passport;
