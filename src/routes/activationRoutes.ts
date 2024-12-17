import { Routes } from '../constants/routes';
import { activateRequestHandler } from '../controllers/authController';
import authMiddleware from '../middleware/authHandler';
import router from './authRoutes';


router.get(Routes.ACTIVATE, authMiddleware, activateRequestHandler);

export default router;