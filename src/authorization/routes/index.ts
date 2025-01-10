import { Router } from 'express';
import { checkSchema } from 'express-validator';

import extractIp from '../../middleware/extractIp';
import validationResultHandler from '../../validators/validationResultHandler';
import { AUTH_ROUTES } from '../constants';
import {
  loginRequestHandler,
  logoutRequestHandler,
  refreshRequestHandler,
  registerRequestHandler,
} from '../controllers/authController';
import authMiddleware from '../middleware/authHandler';
import loginValidatorSchema from '../validators/loginSchema';
import registerValidatorSchema from '../validators/registerSchema';

const router = Router();

router.post(
  AUTH_ROUTES.REGISTER,
  checkSchema(registerValidatorSchema),
  validationResultHandler,
  extractIp,
  registerRequestHandler
);
router.post(
  AUTH_ROUTES.LOGIN,
  checkSchema(loginValidatorSchema),
  validationResultHandler,
  extractIp,
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
