import * as process from 'node:process';
import passport, { Profile } from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import User from '../../account/models/user';
import { getVerifyCallback, initPassport } from '../../authorization/passport';
import {
  FACEBOOK_CALLBACK_URL,
  FACEBOOK_PROFILE_FIELDS,
  GOOGLE_CALLBACK_URL,
  PassportStrategy,
} from '../../constants';

process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.FACEBOOK_CLIENT_ID = 'test-facebook-client-id';
process.env.FACEBOOK_CLIENT_SECRET = 'test-facebook-client-secret';

jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn().mockImplementation(() => {}),
}));

jest.mock('passport-facebook', () => ({
  Strategy: jest.fn().mockImplementation(() => {}),
}));

jest.mock('passport', () => ({
  use: jest.fn(),
}));

jest.mock('../../account/models/user', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe('passport.ts', () => {
  const mockGoogleProfile = {
    id: 'google123',
    displayName: 'Google User',
    emails: [{ value: 'google@google.com' }],
  };

  const mockFacebookProfile = {
    id: 'facebook123',
    name: { givenName: 'Facebook', familyName: 'User' },
    emails: [{ value: 'facebook@example.com' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Google and Facebook strategies', () => {
    initPassport();

    expect(passport.use).toHaveBeenCalledWith(expect.any(GoogleStrategy));
    expect(passport.use).toHaveBeenCalledWith(expect.any(FacebookStrategy));

    expect(GoogleStrategy).toHaveBeenCalledWith(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      expect.any(Function)
    );

    expect(FacebookStrategy).toHaveBeenCalledWith(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: FACEBOOK_CALLBACK_URL,
        profileFields: FACEBOOK_PROFILE_FIELDS,
      },
      expect.any(Function)
    );
  });

  describe('getVerifyCallback', () => {
    it('should find an existing user in the database', async () => {
      const done = jest.fn();
      const mockUser = { _id: 'user123', googleId: 'google123' };

      jest.mocked(User.findOne).mockResolvedValueOnce(mockUser);

      const verifyCallback = getVerifyCallback(PassportStrategy.Google);

      await verifyCallback(
        'accessToken',
        'refreshToken',
        mockGoogleProfile as Profile,
        done
      );

      expect(User.findOne).toHaveBeenCalledWith({ googleId: 'google123' });
      expect(User.create).not.toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should create a new user for Google profile if not found in the database', async () => {
      const done = jest.fn();
      const mockUser = { _id: 'user123', googleId: 'google123' };

      jest.mocked(User.findOne).mockResolvedValueOnce(null);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      jest.mocked(User.create).mockResolvedValueOnce(mockUser);

      const verifyCallback = getVerifyCallback(PassportStrategy.Google);
      await verifyCallback(
        'accessToken',
        'refreshToken',
        mockGoogleProfile as Profile,
        done
      );

      expect(User.findOne).toHaveBeenCalledWith({ googleId: 'google123' });
      expect(User.create).toHaveBeenCalledWith({
        googleId: mockGoogleProfile.id,
        email: mockGoogleProfile.emails[0].value,
        userName: mockGoogleProfile.displayName,
      });
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should create a new user for Facebook profile if not found', async () => {
      const done = jest.fn();
      const mockUser = { _id: 'user123', facebookId: 'facebook123' };

      jest.mocked(User.findOne).mockResolvedValueOnce(null);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      jest.mocked(User.create).mockResolvedValueOnce(mockUser);

      const verifyCallback = getVerifyCallback(PassportStrategy.Facebook);
      await verifyCallback(
        'accessToken',
        'refreshToken',
        mockFacebookProfile as Profile,
        done
      );

      expect(User.findOne).toHaveBeenCalledWith({ facebookId: 'facebook123' });
      expect(User.create).toHaveBeenCalledWith({
        facebookId: mockFacebookProfile.id,
        email: mockFacebookProfile.emails[0].value,
        userName: `${mockFacebookProfile.name.givenName} ${mockFacebookProfile.name.familyName}`,
      });
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle database errors during user lookup', async () => {
      const done = jest.fn();

      jest.mocked(User.findOne).mockRejectedValueOnce(new Error('Database error'));

      const verifyCallback = getVerifyCallback(PassportStrategy.Google);
      await verifyCallback(
        'accessToken',
        'refreshToken',
        mockGoogleProfile as Profile,
        done
      );

      expect(done).toHaveBeenCalledWith(expect.any(Error), false);
    });

    it('should handle database errors during user creation', async () => {
      const done = jest.fn();

      jest.mocked(User.findOne).mockResolvedValueOnce(null);
      jest.mocked(User.create).mockRejectedValueOnce(new Error('Database error'));

      const verifyCallback = getVerifyCallback(PassportStrategy.Google);
      await verifyCallback(
        'accessToken',
        'refreshToken',
        mockGoogleProfile as Profile,
        done
      );

      expect(User.create).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});
