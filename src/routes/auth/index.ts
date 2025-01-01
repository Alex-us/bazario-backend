import { Router } from 'express';
import { checkSchema } from 'express-validator';

import {
  loginRequestHandler,
  logoutRequestHandler,
  refreshRequestHandler,
  registerRequestHandler,
} from '../../controllers/auth';
import authMiddleware from '../../middleware/authHandler';
import extractIp from '../../middleware/extractIp';
import loginValidatorSchema from '../../validators/loginSchema';
import registerValidatorSchema from '../../validators/registerSchema';
import validationResultHandler from '../../validators/validationResultHandler';
import { Routes } from '../constants';

const router = Router();

router.post(
  Routes.AUTH.REGISTER,
  checkSchema(registerValidatorSchema),
  validationResultHandler,
  extractIp,
  registerRequestHandler
);
router.post(
  Routes.AUTH.LOGIN,
  checkSchema(loginValidatorSchema),
  validationResultHandler,
  extractIp,
  loginRequestHandler
);
router.post(Routes.AUTH.LOGOUT, authMiddleware, logoutRequestHandler);
router.post(Routes.AUTH.REFRESH, authMiddleware, refreshRequestHandler);

// Google OAuth routes
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

// Facebook OAuth routes
// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), authController.facebookCallback);

export default router;
