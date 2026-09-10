import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  getSnippets,
  createSnippet,
  updateSnippet,
  deleteSnippet,
} from '../controllers/snippet.controller.js';

const router = Router();

// All snippet operations are user-authenticated
router.use(authMiddleware);

router.get('/', getSnippets);
router.post('/', createSnippet);
router.patch('/:id', updateSnippet);
router.delete('/:id', deleteSnippet);

export default router;
