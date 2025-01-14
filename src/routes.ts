import { Router } from 'express';

import accountRoutes from './account/routes';
import authRoutes from './authorization/routes';
import { ACCOUNT_ROUTES, AUTH_ROUTES } from './constants';

const rootRouter = Router();

rootRouter.use(ACCOUNT_ROUTES.ROOT, accountRoutes);
rootRouter.use(AUTH_ROUTES.ROOT, authRoutes);

export { rootRouter };
