import express from 'express';
import controller from '../controllers/incident.controller.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  updateIncidentSchema,
  acknowledgeIncidentSchema,
  addCommentSchema,
  incidentQuerySchema,
} from '../controllers/validators/incident.validators.js';
import { UserRoles } from '../constants.js';

const { Router } = express;
const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate({ query: incidentQuerySchema }),
  controller.listIncidents
);

router.get('/:id', controller.getIncident);

router.patch(
  '/:id',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: updateIncidentSchema }),
  controller.updateIncident
);

router.post(
  '/:id/acknowledge',
  validate({ body: acknowledgeIncidentSchema }),
  controller.acknowledgeIncident
);

router.post(
  '/:id/comments',
  validate({ body: addCommentSchema }),
  controller.addComment
);

router.get('/:id/timeline', controller.getTimeline);

export default router;
