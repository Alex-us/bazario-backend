import { Router } from 'express';
import { checkSchema } from 'express-validator';

import * as authController from '../controllers/authController';
import authMiddleware from '../middleware/authHandler';
import extractIp from '../middleware/extractIp';
import loginValidatorSchema from '../validators/loginSchema';
import registerValidatorSchema from '../validators/registerSchema';
import validationResultHandler from '../validators/validationResultHandler';

const router = Router();

router.post(
  '/register',
  checkSchema(registerValidatorSchema, ['body']),
  validationResultHandler,
  extractIp,
  authController.register
);
router.post(
  '/login',
  checkSchema(loginValidatorSchema),
  validationResultHandler,
  extractIp,
  authController.login
);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', authMiddleware, authController.refresh);
router.get('/activate/:token', authMiddleware, authController.activate);
router.get('/users', authMiddleware, authController.getUsers);

// Google OAuth routes
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

// Facebook OAuth routes
// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), authController.facebookCallback);

export default router;
