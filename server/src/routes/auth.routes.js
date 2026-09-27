import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, googleAuthSchema } from '../validators/auth.validator.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication requests from this IP, please try again later',
      details: null,
    },
  },
});

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post(
  '/google',
  authLimiter,
  validate({ body: googleAuthSchema }),
  authController.googleLogin,
);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.getMe);

export default router;
