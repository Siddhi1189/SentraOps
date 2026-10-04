import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  createAlertRuleSchema,
  updateAlertRuleSchema,
  snoozeAlertRuleSchema,
} from '../controllers/validators/alertRule.validators.js';
import {
  listAlertRules,
  getAlertRule,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  snoozeAlertRule,
  unsnoozeAlertRule,
} from '../controllers/alertRule.controller.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(listAlertRules)
  .post(authorize('owner', 'admin'), validate({ body: createAlertRuleSchema }), createAlertRule);

router.route('/:id')
  .get(getAlertRule)
  .patch(authorize('owner', 'admin'), validate({ body: updateAlertRuleSchema }), updateAlertRule)
  .delete(authorize('owner', 'admin'), deleteAlertRule);

router.route('/:id/snooze')
  .post(authorize('owner', 'admin'), validate({ body: snoozeAlertRuleSchema }), snoozeAlertRule)
  .delete(authorize('owner', 'admin'), unsnoozeAlertRule);

export default router;
