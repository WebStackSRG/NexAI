import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { auth } from '../middleware/auth.js';
import { creditCheck } from '../middleware/creditCheck.js';
import { validate } from '../middleware/validate.js';
import {
  suggestLibrarySchema,
  createLibraryItemSchema,
  updateLibraryItemSchema,
  queryLibrarySchema,
  searchLibrarySchema,
} from '../validators/library.validator.js';
import {
  suggestItem,
  createItem,
  listItems,
  getItemById,
  updateItem,
  deleteItem,
  searchItems,
} from '../controllers/library.controller.js';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many AI requests from this IP, please try again shortly',
      details: null,
    },
  },
});

// All library routes require authentication
router.use(auth);

// Suggestion endpoint (metred AI call, does not save to DB)
router.post(
  '/suggest',
  aiLimiter,
  creditCheck,
  validate({ body: suggestLibrarySchema }),
  suggestItem,
);

// Core CRUD
router.post('/', validate({ body: createLibraryItemSchema }), createItem);
router.get('/', validate({ query: queryLibrarySchema }), listItems);
router.get('/search', validate({ query: searchLibrarySchema }), searchItems);

router.get('/:id', getItemById);
router.patch('/:id', validate({ body: updateLibraryItemSchema }), updateItem);
router.delete('/:id', deleteItem);

export default router;
