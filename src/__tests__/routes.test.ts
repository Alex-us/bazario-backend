import express from 'express';
import request from 'supertest';

import { ACCOUNT_ROUTES } from '../account/constants';
import { AUTH_ROUTES } from '../authorization/constants';
import { rootRouter } from '../routes';

jest.mock('../authorization/routes', () =>
  jest.fn((req, res) => res.status(200).send('Auth route working'))
);
jest.mock('../account/routes', () =>
  jest.fn((req, res) => res.status(200).send('Activation route working'))
);

const app = express();
app.use(express.json());
app.use(rootRouter);
//404
app.use((req, res) => {
  res.status(404).send('Not Found');
});

describe('Index Router', () => {
  it('should use authRoutes at /authorization', async () => {
    const response = await request(app).get(`${AUTH_ROUTES.ROOT}`);
    expect(response.status).toBe(200);
    expect(response.text).toBe('Auth route working');
  });

  it('should use account at /account', async () => {
    const response = await request(app).get(`${ACCOUNT_ROUTES.ROOT}`);
    expect(response.status).toBe(200);
    expect(response.text).toBe('Activation route working');
  });

  it('should return 404 for undefined routes', async () => {
    const response = await request(app).get('/undefined-route');
    expect(response.status).toBe(404);
    expect(response.text).toBe('Not Found');
  });
});
