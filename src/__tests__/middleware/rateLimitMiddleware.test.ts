import express from 'express';
import request from 'supertest';

import * as authMiddleware from '../../authorization/middleware';
import authRoutes from '../../authorization/routes';
import { AUTH_ROUTES } from '../../constants';
import * as middleware from '../../middleware';
import { requestsLimiterMiddleware } from '../../middleware';

const app = express();
app.use(express.json());
app.use(requestsLimiterMiddleware);
app.use(AUTH_ROUTES.ROOT, authRoutes);

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

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
  it('should allow up to 5 login attempts', async () => {
    const spyA = jest
      .spyOn(middleware, 'extractIpMiddleware')
      .mockImplementation((req, res, next) => next());
    const spyB = jest
      .spyOn(middleware, 'validationResultMiddleware')
      .mockImplementation((req, res, next) => next());

    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post(`${AUTH_ROUTES.ROOT}${AUTH_ROUTES.LOGIN}`)
        .send({ email: 'test@example.com', password: 'wrong' });
      expect(response.status).toBe(200);
    }

    const response = await request(app)
      .post(`${AUTH_ROUTES.ROOT}${AUTH_ROUTES.LOGIN}`)
      .send({ email: 'test@example.com', password: 'wrong' });
    expect(response.status).toBe(429);

    spyA.mockRestore();
    spyB.mockRestore();
  });

  it('should allow up to 100 requests for general endpoints', async () => {
    jest
      .spyOn(authMiddleware, 'authMiddleware')
      .mockImplementation(async (req, res, next) => next());
    for (let i = 0; i < 94; i++) {
      const response = await request(app).post(
        `${AUTH_ROUTES.ROOT}${AUTH_ROUTES.REGISTER}`
      );
      expect(response.status).toBe(201);
    }

    const response = await request(app).post(
      `${AUTH_ROUTES.ROOT}${AUTH_ROUTES.REGISTER}`
    );
    expect(response.status).toBe(429);
  });
});
