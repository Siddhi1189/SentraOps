import express from 'express';
import { recordHeartbeat } from '../controllers/heartbeat.controller.js';
import { heartbeatRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(heartbeatRateLimiter);

router.route('/:token')
  .get(recordHeartbeat)
  .post(recordHeartbeat);

export default router;
