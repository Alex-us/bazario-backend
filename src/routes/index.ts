import { Router } from 'express';

import activationRoutes from './activation';
import authRoutes from './auth';
import { Routes } from './constants';

const rootRouter = Router();

rootRouter.use(Routes.AUTH.ROOT, authRoutes);

export { rootRouter, activationRoutes };
