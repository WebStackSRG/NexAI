import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateSettingsSchema } from '../validators/user.validator.js';

const router = Router();

router.patch(
  '/me/settings',
  auth,
  validate({ body: updateSettingsSchema }),
  userController.updateSettings,
);

export default router;
