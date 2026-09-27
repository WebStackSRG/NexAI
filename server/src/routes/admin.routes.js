import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import {
  getStats,
  getUsage,
  getTransactions,
  getErrors,
} from '../controllers/admin.controller.js';
import {
  adminQueryUsageSchema,
  adminPaginationSchema,
} from '../validators/admin.validator.js';

const router = Router();

// Gated strictly to authenticated admin users (HTTP 403 for non-admins)
router.use(auth, requireRole('admin'));

router.get('/stats', getStats);
router.get('/usage', validate({ query: adminQueryUsageSchema }), getUsage);
router.get('/transactions', validate({ query: adminPaginationSchema }), getTransactions);
router.get('/errors', validate({ query: adminPaginationSchema }), getErrors);

export default router;
