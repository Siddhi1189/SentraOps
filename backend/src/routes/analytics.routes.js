import express from 'express';
import controller from '../controllers/analytics.controller.js';
import authenticate from '../middlewares/authenticate.js';


const { Router } = express;
const router = Router();

router.use(authenticate);

router.get('/services/:id', controller.getServiceAnalytics);
router.get('/incidents', controller.getIncidentAnalytics);

export default router;
