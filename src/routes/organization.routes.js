import express from 'express';
import controller from '../controllers/organization.controller.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import { inviteMemberSchema, updateMemberRoleSchema, paginationSchema } from '../controllers/validators/organization.validators.js';
import { UserRoles } from '../constants.js';


const { Router } = express;
const router = Router();

router.use(authenticate);

router.get('/', controller.getOrganization);
router.post(
  '/invite',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: inviteMemberSchema }),
  controller.invite
);
router.get(
  '/members',
  validate({ query: paginationSchema }),
  controller.listMembers
);
router.patch(
  '/members/:userId/role',
  authorize(UserRoles.OWNER),
  validate({ body: updateMemberRoleSchema }),
  controller.updateMemberRole
);
router.delete(
  '/members/:userId',
  authorize(UserRoles.OWNER),
  controller.removeMember
);

export default router;
