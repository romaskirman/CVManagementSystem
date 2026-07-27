import { Router } from 'express';
import passport from 'passport';
import { validate } from '../middlewares/validate.middleware';
import { AuthRepository } from '../modules/auth/auth.repository';
import { AuthService } from '../modules/auth/auth.service';
import { AuthController } from '../modules/auth/auth.controller';
import {
  loginSchema,
  registerSchema,
  resendVerificationCodeSchema,
  verifyEmailSchema
} from '../modules/auth/auth.schemas';
import { VerificationCodeService } from '../modules/auth/verification-code.service';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

const authRepository = new AuthRepository();
const verificationCodeService = new VerificationCodeService();
const authService = new AuthService(authRepository, verificationCodeService);
const authController = new AuthController(authService);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

router.post(
  '/verify-email',
  requireAuth,
  validate(verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  '/resend-verification-code',
  validate(resendVerificationCodeSchema),
  authController.resendVerificationCode
);

router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/oauth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/oauth/failure',
    session: true
  }),
  authController.oauthSuccess
);

router.get('/oauth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/oauth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/api/auth/oauth/failure',
    session: true
  }),
  authController.oauthSuccess
);

router.get('/oauth/failure', authController.oauthFailure);

export const authRouter = router;
