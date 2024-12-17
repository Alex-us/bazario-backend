import { Router } from 'express';

import { Routes } from '../constants/routes';
import activationRoutes from './activationRoutes';
import authRoutes from './authRoutes';

const rootRouter = Router();

rootRouter.use(Routes.AUTH.ROOT, authRoutes);

export default rootRouter;
export { activationRoutes };
