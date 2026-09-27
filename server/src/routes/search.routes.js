import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { searchQuerySchema } from '../validators/search.validator.js';
import { searchAll } from '../controllers/search.controller.js';

const router = Router();

// All search routes require authentication
router.use(auth);

// Unified search across Library, Prompts, and Chats
router.get('/', validate({ query: searchQuerySchema }), searchAll);

export default router;
