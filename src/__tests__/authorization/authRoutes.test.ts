import express from 'express';
import request from 'supertest';

import authRoutes from '../../authorization/routes';
import { AUTH_ROUTES } from '../../constants';

jest.mock('../../authorization/controllers/authController', () => ({
  registerRequestHandler: jest.fn((req, res) =>
    res.status(201).json({ message: 'User registered successfully' })
  ),
  loginRequestHandler: jest.fn((req, res) =>
    res
      .status(200)
      .json({ token: 'access_token', user: { id: 'userId', email: 'test@example.com' } })
  ),
  logoutRequestHandler: jest.fn((req, res) =>
    res.status(200).json({ message: 'Logged out successfully' })
  ),
  refreshRequestHandler: jest.fn((req, res) =>
    res.status(200).json({ token: 'new_access_token' })
  ),
}));

jest.mock('../../authorization/middleware', () => {
  return { authMiddleware: jest.fn((req, res, next) => next()) };
});
jest.mock('../../middleware', () => {
  return {
    extractIpMiddleware: jest.fn((req, res, next) => next()),
    validationResultMiddleware: jest.fn((req, res, next) => next()),
  };
});

const app = express();
app.use(express.json());
app.use(AUTH_ROUTES.ROOT, authRoutes);

describe('Auth Routes', () => {
  it('should call registerRequestHandler on POST /auth/register', async () => {
    const response = await request(app)
      .post(`${AUTH_ROUTES.ROOT}${AUTH_ROUTES.REGISTER}`)
      .set('X-Forwarded-For', '127.0.0.1')
      .send({
        email: 'test',
        password: 'Password123!',
        deviceId: 'device1',
      });
    //expect(registerRequestHandler).toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'User registered successfully' });
  });

  it('should call loginRequestHandler on POST /auth/login', async () => {
    const response = await request(app)
      .post(`${AUTH_ROUTES.ROOT}${AUTH_ROUTES.LOGIN}`)
      .set('X-Forwarded-For', '127.0.0.1')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      token: 'access_token',
      user: { id: 'userId', email: 'test@example.com' },
    });
  });

  it('should call logoutRequestHandler on POST /auth/logout', async () => {
    const response = await request(app)
      .post(`${AUTH_ROUTES.ROOT}${AUTH_ROUTES.LOGOUT}`)
      .set('Authorization', 'Bearer valid_token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Logged out successfully' });
  });

  it('should call refreshRequestHandler on POST /auth/refresh', async () => {
    const response = await request(app)
      .post(`${AUTH_ROUTES.ROOT}${AUTH_ROUTES.REFRESH}`)
      .set('Authorization', 'Bearer valid_token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ token: 'new_access_token' });
  });
});
