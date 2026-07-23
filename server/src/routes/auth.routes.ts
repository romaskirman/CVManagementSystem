import { Router } from 'express';
import passport from 'passport';
import { validate } from '../middlewares/validate.middleware';
import { AuthRepository } from '../modules/auth/auth.repository';
import { AuthService } from '../modules/auth/auth.service';
import { AuthController } from '../modules/auth/auth.controller';
import { loginSchema, registerSchema } from '../modules/auth/auth.schemas';

const router = Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/oauth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/oauth/failure',
    session: true
  }),
  authController.oauthSuccess
);

router.get('/oauth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get(
  '/oauth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/api/auth/oauth/failure',
    session: true
  }),
  authController.oauthSuccess
);

router.get('/oauth/failure', authController.oauthFailure);

export const authRouter = router;
