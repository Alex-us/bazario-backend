import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { mockUserA } from '../../__mocks__/user';
import activationRoutes from '../../../account/routes';
import * as userService from '../../../account/services/userService';
import { RESPONSE_SUCCESS_MESSAGE, ACCOUNT_ROUTES } from '../../../constants';

process.env.JWT_ACCESS_SECRET = 'some_secret';

const userPayload = {
  id: mockUserA._id,
  deviceId: mockUserA.deviceId,
};

jest.mock('../../../authorization/controllers/authController', () => ({
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
    jest
      .spyOn(userService, 'setUserActiveOrThrow')
      .mockResolvedValueOnce(mockUserA as never);
    const response = await request(app)
      .get(`${ACCOUNT_ROUTES.ACTIVATE}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ token: activationToken });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: RESPONSE_SUCCESS_MESSAGE.OK });
  });
});
