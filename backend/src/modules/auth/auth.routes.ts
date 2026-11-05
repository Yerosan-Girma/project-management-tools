import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rate-limiter';
import { asyncHandler } from '../../utils/async-handler';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from './auth.schema';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', authLimiter, validate({ body: registerSchema }), asyncHandler(controller.register));
router.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(controller.login));
router.post('/refresh', validate({ body: refreshTokenSchema }), asyncHandler(controller.refresh));
router.post('/logout', asyncHandler(controller.logout));
router.post('/verify-email', validate({ body: verifyEmailSchema }), asyncHandler(controller.verifyEmail));
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), asyncHandler(controller.forgotPassword));
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), asyncHandler(controller.resetPassword));

// Protected routes
router.get('/me', authenticate, asyncHandler(controller.me));
router.get('/sessions', authenticate, asyncHandler(controller.getSessions));
router.delete('/sessions/:id', authenticate, asyncHandler(controller.revokeSession));

export default router;
