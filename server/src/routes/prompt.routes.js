import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createPromptSchema,
  updatePromptSchema,
  promptIdParamSchema,
  getPromptsQuerySchema,
} from '../validators/prompt.validator.js';
import {
  getPrompts,
  createPrompt,
  getPromptById,
  updatePrompt,
  deletePrompt,
} from '../controllers/prompt.controller.js';

const router = Router();

// All prompt routes require authenticated session
router.use(auth);

router.get('/', validate({ query: getPromptsQuerySchema }), getPrompts);
router.post('/', validate({ body: createPromptSchema }), createPrompt);
router.get('/:id', validate({ params: promptIdParamSchema }), getPromptById);
router.patch(
  '/:id',
  validate({ params: promptIdParamSchema, body: updatePromptSchema }),
  updatePrompt,
);
router.delete('/:id', validate({ params: promptIdParamSchema }), deletePrompt);

export default router;
