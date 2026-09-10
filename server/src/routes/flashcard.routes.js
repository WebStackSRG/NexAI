import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  getFlashcards,
  createFlashcard,
  reviewFlashcard,
  generateDeck,
  deleteFlashcard,
} from '../controllers/flashcard.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getFlashcards);
router.post('/', createFlashcard);
router.post('/generate', generateDeck);
router.patch('/:id/review', reviewFlashcard);
router.delete('/:id', deleteFlashcard);

export default router;
