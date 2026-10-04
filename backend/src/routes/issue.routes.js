import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import validate from '../middlewares/validate.js';
import {
  issueQuerySchema,
  updateIssueSchema,
  createIncidentFromIssueSchema,
} from '../controllers/validators/issue.validators.js';
import {
  listIssues,
  getIssue,
  getIssueEvents,
  updateIssue,
  createIncidentFromIssue,
} from '../controllers/issue.controller.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(validate({ query: issueQuerySchema }), listIssues);

router.route('/:id')
  .get(getIssue)
  .patch(validate({ body: updateIssueSchema }), updateIssue);

router.route('/:id/events')
  .get(getIssueEvents);

router.route('/:id/incident')
  .post(validate({ body: createIncidentFromIssueSchema }), createIncidentFromIssue);

export default router;
