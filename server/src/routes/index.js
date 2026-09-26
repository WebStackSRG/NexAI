import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import chatRoutes from './chat.routes.js';
import libraryRoutes from './library.routes.js';
import projectRoutes from './project.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/chats', chatRoutes);
router.use('/library', libraryRoutes);
router.use('/projects', projectRoutes);

export default router;
