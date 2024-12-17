import { Router } from 'express';

import { Routes } from '../constants/routes';
import { activateRequestHandler } from '../controllers/authController';
import authMiddleware from '../middleware/authHandler';

const router = Router();

router.get(Routes.ACTIVATE, authMiddleware, activateRequestHandler);

export default router;
