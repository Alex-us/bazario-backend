import { Router } from 'express';

import { ACCOUNT_ROUTES } from './account/constants';
import accountRoutes from './account/routes';
import { AUTH_ROUTES } from './authorization/constants';
import authRoutes from './authorization/routes';

const rootRouter = Router();

rootRouter.use(ACCOUNT_ROUTES.ROOT, accountRoutes);
rootRouter.use(AUTH_ROUTES.ROOT, authRoutes);

export { rootRouter };
