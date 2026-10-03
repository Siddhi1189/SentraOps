import express from 'express';
import controller from '../controllers/notification.controller.js';
import authenticate from '../middlewares/authenticate.js';
import validate from '../middlewares/validate.js';
import {
  notificationQuerySchema,
  notificationIdParamSchema,
} from '../controllers/validators/notification.validators.js';

const { Router } = express;
const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: List notifications for the authenticated user's organization
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed]
 *     responses:
 *       200:
 *         description: List of notifications with read status and unread count
 *
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read for current user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found in caller's organization
 */

router.get(
  '/',
  validate({ query: notificationQuerySchema }),
  controller.listNotifications
);

router.patch(
  '/read-all',
  controller.markAllAsRead
);

router.patch(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  controller.markAsRead
);

export default router;
