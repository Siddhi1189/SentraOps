import express from 'express';
import controller from '../controllers/statusPageSettings.controller.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import { updateStatusPageSettingsSchema } from '../controllers/validators/statusPageSettings.validators.js';
import { UserRoles } from '../constants.js';

const { Router } = express;
const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/status-page-settings:
 *   get:
 *     summary: Get status page settings for the caller's organization
 *     tags: [StatusPage]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Organization status page settings
 *   patch:
 *     summary: Update or upsert status page settings
 *     tags: [StatusPage]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subdomain:
 *                 type: string
 *               customDomain:
 *                 type: string
 *                 nullable: true
 *               logoUrl:
 *                 type: string
 *                 nullable: true
 *               theme:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated status page settings
 *       403:
 *         description: Forbidden (Owner or Admin required)
 */

router.get('/', controller.getSettings);

router.patch(
  '/',
  authorize(UserRoles.OWNER, UserRoles.ADMIN),
  validate({ body: updateStatusPageSettingsSchema }),
  controller.updateSettings
);

export default router;
