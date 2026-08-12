import express from 'express';
import controller from '../controllers/escalation.controller.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import { upsertPolicySchema } from '../controllers/validators/escalation.validators.js';
import { UserRoles } from '../constants.js';


const { Router } = express;
const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post(
  '/',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: upsertPolicySchema }),
  controller.upsert
);
router.delete(
  '/:id',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  controller.remove
);

export default router;
