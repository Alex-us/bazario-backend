export const Routes = {
  ROOT: '/api',
  AUTH: {
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
  },
  USER: {
    ROOT: '/user',
    PROFILE: '/profile',
    SETTINGS: '/settings',
  },
  ADMIN: {
    ROOT: '/admin',
    USERS: '/users',
    DASHBOARD: '/dashboard',
  },
  ACTIVATE: '/activate/:token',
};
