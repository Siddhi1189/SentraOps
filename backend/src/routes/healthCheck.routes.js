import express from 'express';
import controller from '../controllers/healthCheck.controller.js';
import authenticate from '../middlewares/authenticate.js';


const { Router } = express;
const router = Router();

router.use(authenticate);

router.get('/service/:serviceId', controller.getHealthChecksForService);

export default router;
