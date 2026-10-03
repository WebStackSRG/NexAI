import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createMemorySchema,
  updateMemorySchema,
  memoryIdParamSchema,
} from '../validators/memory.validator.js';
import {
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  clearMemories,
} from '../controllers/memory.controller.js';

const router = Router();

// All memory endpoints require authenticated user session
router.use(auth);

router.get('/', getMemories);
router.post('/', validate({ body: createMemorySchema }), createMemory);
router.delete('/', clearMemories);
router.patch(
  '/:id',
  validate({ params: memoryIdParamSchema, body: updateMemorySchema }),
  updateMemory,
);
router.delete('/:id', validate({ params: memoryIdParamSchema }), deleteMemory);

export default router;
