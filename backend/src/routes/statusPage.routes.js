import express from 'express';
import controller from '../controllers/statusPage.controller.js';


const { Router } = express;
const router = Router();

// Public, unauthenticated endpoints for public status page
router.get('/:orgSlug', controller.getStatusPage);
router.get('/:orgSlug/incidents', controller.getStatusPageIncidents);
router.get('/:orgSlug/maintenance', controller.getStatusPageMaintenance);

export default router;
