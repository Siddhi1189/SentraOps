import express from 'express';
import rateLimit from 'express-rate-limit';
import controller from '../controllers/statusPage.controller.js';
import statusSubscriberController from '../controllers/statusSubscriber.controller.js';

const { Router } = express;
const router = Router();

// Strict rate limit for subscribe endpoint to prevent abuse
const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many subscription attempts. Please try again later.' },
});

// Public, unauthenticated endpoints for public status page
router.get('/:orgSlug', controller.getStatusPage);
router.get('/:orgSlug/incidents', controller.getStatusPageIncidents);
router.get('/:orgSlug/maintenance', controller.getStatusPageMaintenance);
router.get('/:orgSlug/uptime', controller.getStatusPageUptime);

// Subscriber endpoints (unauthenticated, rate-limited)
router.post('/:orgSlug/subscribe', subscribeLimiter, statusSubscriberController.subscribe);
router.get('/confirm/:token', statusSubscriberController.confirm);
router.get('/unsubscribe/:token', statusSubscriberController.unsubscribe);

export default router;
