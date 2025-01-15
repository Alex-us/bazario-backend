import { Router } from 'express';
import { checkSchema } from 'express-validator';

import { AUTH_ROUTES } from '../../constants';
import { extractIpMiddleware } from '../../middleware';
import {
  loginRequestHandler,
  logoutRequestHandler,
  refreshRequestHandler,
  registerRequestHandler,
} from '../controllers/authController';
import { authMiddleware, loginLimiterMiddleware } from '../middleware';
import { loginSchema, registerSchema } from '../validators/schema';

const router = Router();

router.post(
  AUTH_ROUTES.REGISTER,
  checkSchema(registerSchema),
  extractIpMiddleware,
  registerRequestHandler
);
router.post(
  AUTH_ROUTES.LOGIN,
  loginLimiterMiddleware,
  checkSchema(loginSchema),
  extractIpMiddleware,
  loginRequestHandler
);
router.post(AUTH_ROUTES.LOGOUT, authMiddleware, logoutRequestHandler);
router.post(AUTH_ROUTES.REFRESH, authMiddleware, refreshRequestHandler);

// Google OAuth routes
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

// Facebook OAuth routes
// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), authController.facebookCallback);

export default router;
