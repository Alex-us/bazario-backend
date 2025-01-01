import { Router } from 'express';

import { activateRequestHandler } from '../../controllers/auth';
import authMiddleware from '../../middleware/authHandler';
import { Routes } from '../constants';

const router = Router();

router.get(Routes.ACTIVATE, authMiddleware, activateRequestHandler);

export default router;
