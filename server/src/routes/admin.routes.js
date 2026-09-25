import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// Gated strictly to authenticated admin users
router.use(auth, requireRole('admin'));

router.get('/stats', (req, res) => {
  res.status(200).json({
    data: {
      message: 'Admin authorization verified',
    },
  });
});

export default router;
