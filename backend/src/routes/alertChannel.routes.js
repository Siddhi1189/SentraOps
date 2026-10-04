import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  createAlertChannelSchema,
  updateAlertChannelSchema,
} from '../controllers/validators/alertChannel.validators.js';
import {
  listAlertChannels,
  getAlertChannel,
  createAlertChannel,
  updateAlertChannel,
  deleteAlertChannel,
  testAlertChannel,
} from '../controllers/alertChannel.controller.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(listAlertChannels)
  .post(authorize('owner', 'admin'), validate({ body: createAlertChannelSchema }), createAlertChannel);

router.route('/:id')
  .get(getAlertChannel)
  .patch(authorize('owner', 'admin'), validate({ body: updateAlertChannelSchema }), updateAlertChannel)
  .delete(authorize('owner', 'admin'), deleteAlertChannel);

router.route('/:id/test')
  .post(authorize('owner', 'admin'), testAlertChannel);

export default router;
