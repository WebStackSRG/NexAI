import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  addSourceSchema,
  sourceIdParamSchema,
} from '../validators/project.validator.js';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectSource,
  deleteProjectSource,
} from '../controllers/project.controller.js';

const router = Router();

// All project endpoints require authenticated user session
router.use(auth);

router.get('/', getProjects);
router.post('/', validate({ body: createProjectSchema }), createProject);
router.get('/:id', validate({ params: projectIdParamSchema }), getProjectById);
router.patch(
  '/:id',
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  updateProject,
);
router.delete('/:id', validate({ params: projectIdParamSchema }), deleteProject);

// Project Knowledge Sources endpoints (local files / documents)
router.post(
  '/:id/sources',
  validate({ params: projectIdParamSchema, body: addSourceSchema }),
  addProjectSource,
);
router.delete(
  '/:id/sources/:sourceId',
  validate({ params: sourceIdParamSchema }),
  deleteProjectSource,
);

export default router;
