export const Routes = {
  ROOT: '/api',
  AUTH: {
    ROOT: '/auth',
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
    REFRESH: '/refresh',
    RESET_PASSWORD: '/reset-password',
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
