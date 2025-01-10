import { Router } from 'express';

import authMiddleware from '../../authorization/middleware/authHandler';
import { ACCOUNT_ROUTES } from '../constants';
import {
  activateRequestHandler,
  requestPasswordResetRequestHandler,
} from '../controllers/accountController';

const router = Router();

router.get(ACCOUNT_ROUTES.ACTIVATE, authMiddleware, activateRequestHandler);
router.post(ACCOUNT_ROUTES.REQUEST_RESET_PASSWORD, requestPasswordResetRequestHandler);

export default router;
