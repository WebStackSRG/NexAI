import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { summarizeYouTube } from '../controllers/learning.controller.js';

const router = Router();
router.use(authMiddleware);

router.post('/youtube-summary', summarizeYouTube);

export default router;
