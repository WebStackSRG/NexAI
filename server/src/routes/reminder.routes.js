import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getWorkspaceSessions,
  createWorkspaceSession,
  deleteWorkspaceSession,
  updateQuietHours,
} from '../controllers/reminder.controller.js';

const router = express.Router();

// All productivity routes require JWT authentication
router.use(authMiddleware);

// Reminders
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.patch('/reminders/:id', updateReminder);
router.delete('/reminders/:id', deleteReminder);

// Workspace Sessions (manual link bundles)
router.get('/sessions', getWorkspaceSessions);
router.post('/sessions', createWorkspaceSession);
router.delete('/sessions/:id', deleteWorkspaceSession);

// Quiet Hours configuration
router.patch('/quiet-hours', updateQuietHours);

export default router;
