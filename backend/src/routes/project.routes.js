import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  createApiKeySchema,
} from '../controllers/validators/project.validators.js';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from '../controllers/project.controller.js';
import { listProjectReleases } from '../controllers/release.controller.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(listProjects)
  .post(authorize('owner', 'admin'), validate({ body: createProjectSchema }), createProject);

router.route('/:id')
  .get(getProject)
  .patch(authorize('owner', 'admin'), validate({ body: updateProjectSchema }), updateProject)
  .delete(authorize('owner', 'admin'), deleteProject);

router.route('/:id/releases')
  .get(listProjectReleases);

router.route('/:id/keys')
  .get(listApiKeys)
  .post(authorize('owner', 'admin'), validate({ body: createApiKeySchema }), createApiKey);

router.route('/:id/keys/:keyId')
  .delete(authorize('owner', 'admin'), revokeApiKey);

export default router;
