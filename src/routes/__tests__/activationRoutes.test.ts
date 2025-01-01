import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { mockUserA } from '../../__mocks__/user';
import * as authService from '../../services/auth';
import activationRoutes from '../activation';
import { Routes } from '../constants';

process.env.JWT_ACCESS_SECRET = 'some_secret';

const userPayload = {
  id: mockUserA._id,
  deviceId: mockUserA.deviceId,
};

jest.mock('../../controllers/auth', () => ({
  activateRequestHandler: jest.fn((req, res) =>
    res.status(200).json({ message: 'User activated' })
  ),
}));

const app = express();
app.use(express.json());
app.use(activationRoutes);

describe('Activation Routes', () => {
  it('should call activateRequestHandler on GET /activate/:token', async () => {
    const activationToken = randomUUID();
    const accessToken = jwt.sign(userPayload, process.env.JWT_ACCESS_SECRET as string, {
      expiresIn: 2000,
    });
    jest.spyOn(authService, 'findUserById').mockResolvedValueOnce(mockUserA as never);
    const response = await request(app)
      .get(`${Routes.ACTIVATE.replace(':token', activationToken)}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'User activated' });
  });
});
