import express from 'express';
import controller from '../controllers/service.controller.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  createServiceSchema,
  updateServiceSchema,
  createGroupSchema,
  updateGroupSchema,
  serviceQuerySchema,
  bulkActionBaseSchema,
  bulkIntervalSchema,
  bulkGroupSchema,
} from '../controllers/validators/service.validators.js';
import { UserRoles } from '../constants.js';

const { Router } = express;
const router = Router();

router.use(authenticate);

// Service Groups Routes
router.post(
  '/groups',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: createGroupSchema }),
  controller.createGroup
);
router.get('/groups', controller.listGroups);
router.get('/groups/:id', controller.getGroup);
router.patch(
  '/groups/:id',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: updateGroupSchema }),
  controller.updateGroup
);
router.delete(
  '/groups/:id',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  controller.deleteGroup
);

// ─── Bulk Actions (Mounted before :id to prevent matching 'bulk' as id) ─────
router.post(
  '/bulk/pause',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: bulkActionBaseSchema }),
  controller.bulkPause
);
router.post(
  '/bulk/resume',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: bulkActionBaseSchema }),
  controller.bulkResume
);
router.post(
  '/bulk/interval',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: bulkIntervalSchema }),
  controller.bulkInterval
);
router.post(
  '/bulk/group',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: bulkGroupSchema }),
  controller.bulkGroup
);
router.delete(
  '/bulk',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: bulkActionBaseSchema }),
  controller.bulkDelete
);
router.post(
  '/bulk/delete',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: bulkActionBaseSchema }),
  controller.bulkDelete
);

// Services Routes
router.post(
  '/',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: createServiceSchema }),
  controller.createService
);
router.get(
  '/',
  validate({ query: serviceQuerySchema }),
  controller.listServices
);
router.get('/:id', controller.getService);
router.patch(
  '/:id',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: updateServiceSchema }),
  controller.updateService
);
router.delete(
  '/:id',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  controller.deleteService
);

// ─── Individual Service Management Actions ──────────────────────────────────
router.post(
  '/:id/pause',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  controller.pauseService
);
router.post(
  '/:id/resume',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  controller.resumeService
);
router.post(
  '/:id/check-now',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  controller.checkNow
);

export default router;
