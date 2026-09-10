import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getUsageStats } from '../controllers/analytics.controller.js';

const router = Router();

// All analytics operations are user-authenticated
router.use(authMiddleware);

router.get('/stats', getUsageStats);

export default router;
