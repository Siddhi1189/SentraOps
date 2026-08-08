import express from 'express';
import controller from '../controllers/maintenance.controller.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import { createMaintenanceSchema, updateMaintenanceSchema, maintenanceQuerySchema } from '../controllers/validators/maintenance.validators.js';
import { UserRoles } from '../constants.js';


const { Router } = express;
const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate({ query: maintenanceQuerySchema }),
  controller.list
);
router.get('/:id', controller.get);
router.post(
  '/',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: createMaintenanceSchema }),
  controller.create
);
router.patch(
  '/:id',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: updateMaintenanceSchema }),
  controller.update
);
router.delete(
  '/:id',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  controller.remove
);

export default router;
