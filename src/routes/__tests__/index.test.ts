import express from 'express';
import request from 'supertest';

import { Routes } from '../constants';
import{ rootRouter, activationRoutes } from '../index';

jest.mock('../auth', () =>
  jest.fn((req, res) => res.status(200).send('Auth route working'))
);
jest.mock('../activation', () =>
  jest.fn((req, res) => res.status(200).send('Activation route working'))
);

const app = express();
app.use(express.json());
app.use(rootRouter);
app.use(Routes.ACTIVATE, activationRoutes);
//404
app.use((req, res) => {
  res.status(404).send('Not Found');
});

describe('Index Router', () => {
  it('should use authRoutes at /auth', async () => {
    const response = await request(app).get(`${Routes.AUTH.ROOT}`);
    expect(response.status).toBe(200);
    expect(response.text).toBe('Auth route working');
  });

  it('should use activationRoutes at /activate', async () => {
    const response = await request(app).get('/activate/token');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Activation route working');
  });

  it('should return 404 for undefined routes', async () => {
    const response = await request(app).get('/undefined-route');
    expect(response.status).toBe(404);
    expect(response.text).toBe('Not Found');
  });
});
